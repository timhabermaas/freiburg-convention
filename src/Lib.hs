{-# LANGUAGE DataKinds         #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TypeOperators     #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE FlexibleInstances #-}

module Lib
    ( startApp
    , app
    , AdminPassword(..)
    , Config(..)
    ) where

import Network.Wai.Handler.Warp (runSettings, defaultSettings, setPort, setOnException)
import Network.Wai.Middleware.RequestLogger (logStdoutDev)
import Servant
import Servant.HTML.Blaze (HTML)
import Control.Monad.IO.Class (liftIO)
import Network.HTTP.Media ((//), (/:))
import Data.Semigroup ((<>))
import Control.Concurrent (forkIO)
import qualified Data.Text as T
import qualified Data.List.NonEmpty as NE
import qualified Data.Text.Encoding as TE
import qualified Data.ByteString as BS
import qualified Data.ByteString.Lazy as BSL
import qualified Text.Digestive.Form.Encoding as DF
import qualified Text.Digestive.Types as DF
import qualified Text.Digestive.View as DF
import qualified Data.Csv as Csv
import qualified Data.Vector as V
import Data.Time.Calendar (Day)
import Data.Time.Clock (UTCTime)
import qualified Data.Time.Format as TimeFormat

import qualified IO.Db as Db
import qualified Html as Page
import qualified Form
import qualified Data.Maybe as M
import qualified IO.Mailer as Mailer
import Types
import qualified Domain.Registration as D
import qualified Domain.Participant as P
import qualified Domain.SharedTypes as DT

data CSV

instance Accept CSV where
    contentType _ = "text" // "csv" /: ("charset", "utf-8")

instance MimeRender CSV BSL.ByteString where
    mimeRender _ val = val

type API
    = Get '[HTML] Page.Html
 :<|> "register" :> ReqBody '[FormUrlEncoded] [(T.Text, T.Text)] :> Post '[HTML] Page.Html
 :<|> "success" :> Get '[HTML] Page.Html
 :<|> "admin" :> BasicAuth "foo-realm" User :> Get '[HTML] Page.Html
 :<|> "admin" :> "registrations.csv" :> BasicAuth "foo-realm" User :> Get '[CSV] BSL.ByteString
 :<|> "registrations" :> BasicAuth "foo-realm" User :> Capture "participantId" ParticipantId :> "delete" :> Post '[HTML] Page.Html
 -- :<|> "registrations" :> BasicAuth "foo-realm" User :> "print" :> Get '[HTML] Page.Html
 :<|> "registrations" :> BasicAuth "foo-realm" User :> Capture "participantId" ParticipantId :> "pay" :> Post '[HTML] Page.Html
 :<|> "admin" :> "participants" :> BasicAuth "foo-realm" User :> Get '[HTML] Page.Html
 :<|> "admin" :> "participants" :> "print" :> BasicAuth "foo-realm" User :> Get '[HTML] Page.Html

newtype AdminPassword = AdminPassword T.Text

data Config = Config
    { configMailerHandle :: Mailer.Handle
    , configDbHandle :: Db.Handle
    , configAdminPassword :: AdminPassword
    , configSleepingLimits :: (GymSleepingLimit, CampingSleepingLimit)
    }

startApp :: String -> Int -> Int -> Int -> AdminPassword -> Maybe String -> IO ()
startApp dbUrl port participationLimit campingLimit pw maybeSendGridApiKey = do
    let mailerConfig = maybe Mailer.PrinterConfig Mailer.SendGridConfig maybeSendGridApiKey
    Mailer.withConfig mailerConfig $ \mailHandle -> do
        Db.withConfig dbUrl $ \db -> do
            Db.migrate db
            let config = Config { configMailerHandle = mailHandle, configDbHandle = db, configAdminPassword = pw, configSleepingLimits = (GymSleepingLimit participationLimit, CampingSleepingLimit campingLimit) }
            runSettings (setOnException exceptionHandler $ setPort port defaultSettings) $ logStdoutDev $ app config
  where
    exceptionHandler _ ex = putStrLn $ show ex

data User = Admin

authCheck :: AdminPassword -> BasicAuthCheck User
authCheck (AdminPassword pw) =
    let check (BasicAuthData username password) =
            if username == "admin" && password == TE.encodeUtf8 pw
            then pure (Authorized Admin)
            else pure Unauthorized
    in
        BasicAuthCheck check

authServerContext :: AdminPassword -> Context (BasicAuthCheck User ': '[])
authServerContext pw = (authCheck pw) :. EmptyContext

app :: Config -> Application
app Config{..} =
    serveWithContext
        api
        (authServerContext configAdminPassword)
        (server configDbHandle configMailerHandle configSleepingLimits)

api :: Proxy API
api = Proxy

server :: Db.Handle -> Mailer.Handle -> (GymSleepingLimit, CampingSleepingLimit) -> Server API
server db mailerHandle limits =
         registerHandler db limits
    :<|> postRegisterHandler db mailerHandle limits
    :<|> successHandler
    :<|> registrationsHandler db limits
    :<|> registrationsCsvHandler db
    :<|> deleteRegistrationsHandler db
    :<|> payRegistrationsHandler db
    :<|> listParticipantsHandler db
    :<|> printParticipantsHandler db

isOverLimit :: Db.Handle -> (GymSleepingLimit, CampingSleepingLimit) -> IO (GymSleepingLimitReached, CampingSleepingLimitReached)
isOverLimit _handle (GymSleepingLimit _gymLimit, CampingSleepingLimit _campingLimit) = do
    pure (EnoughGymSleepingSpots, EnoughTentSpots)
    {-
    sleepovers <- liftIO $ fmap Db.dbParticipantSleepovers <$> Db.allRegistrations handle
    let gymLimitReached =
            if gymSleepCount sleepovers >= gymLimit then
                GymSleepingLimitReached
            else
                EnoughGymSleepingSpots
    let campingLimitReached =
            if campingSleepCount sleepovers >= campingLimit then
                CampingSleepingLimitReached
            else
                EnoughTentSpots
    pure (gymLimitReached, campingLimitReached) -}

registerHandler :: Db.Handle -> (GymSleepingLimit, CampingSleepingLimit) -> Handler Page.Html
registerHandler conn limits = do
    overLimit <- liftIO $ isOverLimit conn limits
    view <- DF.getForm "Registration" $ Form.newRegisterForm overLimit
    pure $ Page.registerPage view overLimit

registrationsHandler :: Db.Handle -> (GymSleepingLimit, CampingSleepingLimit) -> User -> Handler Page.Html
registrationsHandler conn limits user = do
    requireAdmin user
    registrations <- liftIO $ Db.allRegistrations' conn
    pure $ Page.registrationListPage' registrations limits


-- Using newtype wrapper for Participant because the canonical CSV decoder/encoder for the
-- database row isn't exactly what we want.
newtype CsvRegistration = CsvRegistration D.ExistingRegistration

-- The IsString instance of ByteString is not using the source encoding (in this case UTF8),
-- but Char8.pack to convert String to ByteString:
-- `f :: ByteString`, `f "??"` will result in \252.
-- See https://github.com/haskell/bytestring/issues/140
fixEncoding :: T.Text -> BS.ByteString
fixEncoding = TE.encodeUtf8

instance Csv.ToNamedRecord CsvRegistration where
    toNamedRecord (CsvRegistration r@D.Registration{..}) =
        Csv.namedRecord
            [ "E-Mail" Csv..= email
            , "Erster Name" Csv..= P.participantName (NE.head participants)
            , "Verwendungszweck" Csv..= codeToText paymentCode
            , "Summe Tickets" Csv..= (show $ D.priceToPay r)
            , "Bezahlt?" Csv..= (case paidStatus of DT.NotPaid -> "false"; DT.Paid -> "true" :: String)
            , "Anzahl Teilnehmer" Csv..= (show $ length participants)
            , "Anmerkung" Csv..= comment
            , "Angemeldet am" Csv..= iso8601 registeredAt
            ]
      where
        codeToText (DT.PaymentCode f) = f

registrationsCsvHandler :: Db.Handle -> User -> Handler BSL.ByteString
registrationsCsvHandler conn user = do
    requireAdmin user
    registrations <- liftIO $ Db.allRegistrations' conn
    let headers = fixEncoding <$> V.fromList [ "E-Mail", "Erster Name", "Verwendungszweck", "Summe Tickets", "Bezahlt?", "Anzahl Teilnehmer", "Anmerkung", "Angemeldet am" ]
    pure $ Csv.encodeByName headers $ fmap CsvRegistration registrations

instance Csv.ToField DT.Name where
    toField (DT.Name s) = Csv.toField s

instance Csv.ToField DT.City where
    toField (DT.City s) = Csv.toField s

instance Csv.ToField DT.Country where
    toField (DT.Country s) = Csv.toField s

instance Csv.ToField DT.PhoneNumber where
    toField (DT.PhoneNumber s) = Csv.toField s

instance Csv.ToField P.Accommodation where
    toField a = Csv.toField $ show a

iso8601Day :: Day -> String
iso8601Day d = TimeFormat.formatTime TimeFormat.defaultTimeLocale (TimeFormat.iso8601DateFormat Nothing) d

iso8601 :: UTCTime -> String
iso8601 = TimeFormat.formatTime TimeFormat.defaultTimeLocale "%FT%T%QZ"

postRegisterHandler :: Db.Handle -> Mailer.Handle -> (GymSleepingLimit, CampingSleepingLimit) -> [(T.Text, T.Text)] -> Handler Page.Html
postRegisterHandler conn mailerHandle limits body = do
    overLimit <- liftIO $ isOverLimit conn limits
    r <- DF.postForm "Registration" (Form.newRegisterForm overLimit) $ servantPathEnv body
    case r of
        (view, Nothing) -> do
            liftIO $ print view
            pure $ Page.registerPage view overLimit
        (_, Just botCheckedRegistration) -> do
            case botCheckedRegistration of
                Form.IsBot -> do
                    liftIO $ putStrLn "is bot"
                    redirectTo "/success"
                Form.IsHuman registration -> do
                    liftIO $ putStrLn $ show registration
                    registrationId <- liftIO $ Db.saveRegistration' conn registration
                    registration <- liftIO $ Db.getRegistration conn registrationId
                    liftIO $ forkIO $ Mailer.sendMail mailerHandle $ mailForRegistration registration
                    redirectTo "/success"

deleteRegistrationsHandler :: Db.Handle -> User -> ParticipantId -> Handler Page.Html
deleteRegistrationsHandler conn user (ParticipantId participantId) = do
    requireAdmin user
    liftIO $ Db.deleteRegistration conn (Db.DbId participantId)
    redirectTo "/admin"

payRegistrationsHandler :: Db.Handle -> User -> ParticipantId -> Handler Page.Html
payRegistrationsHandler conn user (ParticipantId participantId) = do
    requireAdmin user
    liftIO $ Db.payRegistration conn (Db.DbId participantId)
    redirectTo "/admin"

printParticipantsHandler :: Db.Handle -> User -> Handler Page.Html
printParticipantsHandler conn user = do
    requireAdmin user
    participants <- liftIO $ Db.allParticipantsWithRegistration conn
    pure $ Page.participationPrintPage participants


printRegistrationsHandler :: Db.Handle -> User -> Handler Page.Html
printRegistrationsHandler conn user = do
    requireAdmin user
    regs <- liftIO $ Db.allRegistrationsOrderedByName conn
    pure $ Page.registrationPrintPage regs

listParticipantsHandler :: Db.Handle -> User -> Handler Page.Html
listParticipantsHandler  conn user = do
    requireAdmin user
    participants <- liftIO $ Db.allParticipantsWithRegistration conn
    pure $ Page.participationListPage participants


successHandler :: Handler Page.Html
successHandler = do
    pure Page.successPage

redirectTo :: BS.ByteString -> Handler a
redirectTo url =
    throwError $ err303 { errHeaders = [("Location", url)] }

servantPathEnv :: (Monad m) => [(T.Text, T.Text)] -> DF.FormEncType -> m (DF.Env m)
servantPathEnv body _ = pure env
  where
    lookupParam :: DF.Path -> [T.Text]
    lookupParam p = snd <$> filter (\(k, _) -> k == DF.fromPath p) body
    env :: (Monad m) => DF.Path -> m [DF.FormInput]
    env path = return (DF.TextInput <$> lookupParam path)

data Language = German | English

mailForRegistration :: D.ExistingRegistration -> Mailer.Mail
mailForRegistration registration = Mailer.Mail mailBodyComplete subject (mailAddress, firstParticipantName)
  where
    (DT.Name firstParticipantName) = P.participantName $ NE.head $ D.participants registration
    mailAddress = DT.MailAddress $ D.email registration
    subject = "Bestellbest??tigung Freiburger Jonglierfestival"
    newLine = "\n\n"
    totalPrice = T.pack $ show $ D.priceToPay registration
    (DT.PaymentCode paymentReason) = D.paymentCode registration
    nameAndTicketLine p =
        let
            (P.Ticket _ age stay price) = P.participantTicket p
            (DT.Name name) = P.participantName p
        in
            "* " <> name <> " " <> P.ageLabel age <> " " <> P.stayLabel stay <> " " <> T.pack (show price)
    mailBodyComplete =
        "(English version below)" <> newLine <> newLine <>
        mailBody German <> newLine <> newLine <> newLine <> newLine <> mailBody English

    mailBody language = T.intercalate newLine $ M.catMaybes
        ([ Just $ salutation language <> " " <> firstParticipantName <> ","
        , Just $ ""
        , Just $ ticketText language
        , Just $ ""
        , Just $ T.intercalate newLine $ NE.toList $ fmap nameAndTicketLine (D.participants registration)
        , Just $ ""
        , ((commentText language <> " ") <>) <$> D.comment registration
        , Just $ ""
        ] <> fmap Just (restText language))
    ticketText German = "du hast f??r das 21. Freiburger Jonglierfestival folgende Tickets bestellt:"
    ticketText English = "you ordered the following tickets for the Freiburg Juggling Convention:"
    salutation German = "Liebe/r"
    salutation English = "Dear"
    commentText German = "Au??erdem hast du uns folgenden Kommentar hinterlassen:"
    commentText English = "You sent us the following comment:"
    restText German =
        [ "Bitte bezahle dein(e) Ticket(s) bar an der Festivalkasse."
        , ""
        , "Wir freuen uns Dich auf dem Festival zu sehen."
        , "Viele Gr????e Dein"
        , "Orgateam"
        ]
    restText English =
        [ "Please pay your ticket(s) in cash at the festival."
        , ""
        , "We're looking forward to meeting you at the festival!"
        , "Cheers!"
        , "Your orga team"
        ]

requireAdmin :: User -> Handler ()
requireAdmin Admin = pure ()
requireAdmin _ = throwError err401
