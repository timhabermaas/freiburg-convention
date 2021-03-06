{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

module Form
    ( newRegisterForm
    , Participant(..)
    , BotCheckResult(..)
    ) where

import Types
import qualified Text.Digestive.Form as DF
import qualified Text.Digestive.Types as DT
import qualified Data.Text as T
import qualified Data.Set as Set
import qualified Data.List.NonEmpty as NE
import Data.Time.Calendar (Day, fromGregorianValid, fromGregorian)
import qualified Domain.Registration as Domain
import qualified Domain.Participant as Domain
import qualified Domain.SharedTypes as SharedTypes
import Prelude hiding (id)
import qualified Prelude as Prelude

data BotCheckResult a = IsBot | IsHuman a deriving Show

participantIsEmpty :: Domain.NewParticipant -> Bool
participantIsEmpty = SharedTypes.nameEmpty . Domain.participantName

checkForBot :: Monad m => DF.Form T.Text m a -> DF.Form T.Text m (BotCheckResult a)
checkForBot innerForm = (\t -> if T.null t then IsHuman else const IsBot) <$> "botField" DF..: DF.text Nothing <*> innerForm

newRegisterForm :: Monad m => (GymSleepingLimitReached, CampingSleepingLimitReached) -> DF.Form T.Text m (BotCheckResult Domain.NewRegistration)
newRegisterForm _ = checkForBot $
    Domain.Registration <$> pure ()
                        <*> "email" DF..: validateAndNormalizeEmail (mustBePresent (DF.text Nothing))
                        <*> "participants" DF..: mustContainAtLeastOne "Mindestens ein Teilnehmer muss angegeben werden." (fmap (filter (not . participantIsEmpty)) $ DF.listOf participantForm (Just $ replicate 5 defaultParticipant))
                        <*> "comment" DF..: optionalText
                        <*> pure ()
                        <*> pure ()
                        <*> pure ()
  where
    defaultParticipant :: Domain.NewParticipant
    defaultParticipant =
        Domain.Participant' () (Domain.PersonalInformation (SharedTypes.Name "") (SharedTypes.Birthday $ fromGregorian 2000 10 10)) Domain.defaultTicket Domain.Gym

validateAndNormalizeEmail :: Monad m => DF.Form T.Text m T.Text -> DF.Form T.Text m T.Text
validateAndNormalizeEmail = DF.validate validateEmail
  where
    validateEmail rawEmail =
        let
            strippedEmail = T.strip rawEmail
            atSignCount = T.length $ T.filter (== '@') strippedEmail
            -- T.breakOn also returns the @, therefore remove it using drop.
            (partBeforeAt, partAfterAt) = T.drop 1 <$> T.breakOn "@" strippedEmail
            partBeforeAtNonEmpty = not $ T.null $ T.strip partBeforeAt
            partAfterAtNonEmpty = not $ T.null $ T.strip partAfterAt
        in
            if atSignCount > 0 && partBeforeAtNonEmpty && partAfterAtNonEmpty
                then DT.Success strippedEmail
                else DT.Error "not a valid email address"

data Mandatory = Mandatory | NotMandatory

-- Represents multiple choices with an "other" field where the user can type in any value.
multipleWithFreeFormField :: (Ord a, Monad m) => Mandatory -> [(a, T.Text)] -> (T.Text -> a, T.Text) -> DF.Form T.Text m (Set.Set a)
multipleWithFreeFormField mandatory choices (freeFormConstructor, freeFormLabel) =
    foo freeFormConstructor <$> "text" DF..: DF.text Nothing
                            <*> "choice" DF..: mandatoryOrNot (DF.choiceMultiple allChoices Nothing)
  where
    mandatoryOrNot =
        case mandatory of
            Mandatory -> fmap NE.toList . mustContainAtLeastOne "can't be blank"
            NotMandatory -> Prelude.id
    allChoices = ((\(value, label) -> (Just value, label)) <$> choices) ++ [(Nothing, freeFormLabel)]
    foo :: (Ord a) => (T.Text -> a) -> T.Text -> [Maybe a] -> Set.Set a
    foo f text selected = Set.fromList (unwrapElement text f <$> selected)
    unwrapElement :: T.Text -> (T.Text -> a) -> (Maybe a) -> a
    unwrapElement _ _ (Just x) = x
    unwrapElement otherText f Nothing = f otherText


participantForm :: Monad m => DF.Formlet T.Text m Domain.NewParticipant
participantForm _def =
    buildParticipant <$> "name" DF..: DF.text Nothing
                     <*> "birthday" DF..: birthdayFields
                     <*> "ticket" DF..: ticketForm Domain.jugglerTicketChoices
                     <*> "accommodation" DF..: sleepingForm (Just Domain.Gym)
  where
    buildParticipant :: T.Text -> Day -> Domain.Ticket -> Domain.Accommodation -> Domain.NewParticipant
    buildParticipant name birthday ticket sleeping = Domain.Participant' () (Domain.PersonalInformation (SharedTypes.Name name) (SharedTypes.Birthday birthday)) ticket sleeping

sleepingForm :: Monad m => DF.Formlet T.Text m Domain.Accommodation
sleepingForm = DF.choice allChoices
  where
    allChoices :: [(Domain.Accommodation, T.Text)]
    allChoices =
        [ (Domain.Gym, "Schlafhalle (gym)")
        , (Domain.Camping, "Zelt neben der Halle (tent)")
        , (Domain.SelfOrganized, "Ich sorge f??r meine eigene ??bernachtung (self-organized)")
        ]

ticketForm :: Monad m => [Domain.Ticket] -> DF.Form T.Text m Domain.Ticket
ticketForm availableTickets = DF.choice ticketChoicesWithLabel (Just Domain.defaultTicket)
  where
    ticketChoicesWithLabel :: [(Domain.Ticket, T.Text)]
    ticketChoicesWithLabel = zip availableTickets $ Domain.ticketLabel <$> availableTickets

-- TODO: This might benefit from using Selective Functors. We want to make a decision based on the BotStatus
{-
registerForm :: (Monad m) => (GymSleepingLimitReached, CampingSleepingLimitReached) -> DF.Form T.Text m (BotStatus, Participant)
registerForm isOverLimit =
    (,) <$> botField
        <*> participant
  where
    -- Preventing bot form submissions by checking for a form field not being filled out.
    botField = (\t -> if T.null t then IsHuman else IsBot) <$> "botField" DF..: DF.text Nothing
    participant = Participant <$> "name" DF..: mustBePresent (DF.text Nothing)
                              <*> "birthday" DF..: birthdayFields
                              <*> pure ""
                              <*> pure ""
                              <*> pure ""
                              <*> optionalSleepover
                              <*> pure ""
                              <*> "comment" DF..: optionalText
                              <*> "email" DF..: optionalText

    optionalText =
        (\t -> if T.null t then Nothing else Just t) <$> DF.text Nothing
    optionalSleepover =
        case isOverLimit of
            (GymSleepingLimitReached, CampingSleepingLimitReached) -> pure CouldntSelect
            (EnoughGymSleepingSpots, CampingSleepingLimitReached) -> "sleepover" DF..: DF.choice (filter (\(s, _) -> s /= Camping) allChoices) (Just GymSleeping)
            (GymSleepingLimitReached, EnoughTentSpots) -> "sleepover" DF..: DF.choice (filter (\(s, _) -> s /= GymSleeping) allChoices) (Just Camping)
            (EnoughGymSleepingSpots, EnoughTentSpots) -> "sleepover" DF..: DF.choice allChoices (Just GymSleeping)

    allChoices =
        [ (GymSleeping, "Ich schlafe im Klassenzimmer.")
        , (Camping, "Ich schlafe im Zelt auf dem Schulgel??nde.")
        , (NoNights, "Ich sorge f??r meine eigene ??bernachtung.")
        ]
-}

dateFields :: Monad m => (Integer, Int, Int) -> DF.Form T.Text m Day
dateFields (year, month, day) =
    DF.validate (maybe (DT.Error "not a valid date") DT.Success)
  $ fromGregorianValid <$> "year" DF..: DF.choice years (Just year)
                       <*> "month" DF..: DF.choice months (Just month)
                       <*> "day" DF..: DF.choice days (Just day)
  where
    years :: [(Integer, T.Text)]
    years = fmap (\y -> (y, T.pack $ show y)) [1850..2020]

    months :: [(Int, T.Text)]
    months =
        [ (1, "Januar")
        , (2, "Februar")
        , (3, "M??rz")
        , (4, "April")
        , (5, "Mai")
        , (6, "Juni")
        , (7, "Juli")
        , (8, "August")
        , (9, "September")
        , (10, "Oktober")
        , (11, "November")
        , (12, "Dezember")
        ]

    days :: [(Int, T.Text)]
    days = fmap (\y -> (y, T.pack $ show y)) [1..31]

birthdayFields :: Monad m => DF.Form T.Text m Day
birthdayFields = dateFields (1990, 1, 1)

mustBePresent :: (Monad m) => DF.Form T.Text m T.Text -> DF.Form T.Text m T.Text
mustBePresent = DF.check "can't be blank" notEmpty
  where
    notEmpty = not . T.null . T.strip

maybeEmpty :: (Monad m) => DF.Form T.Text m T.Text -> DF.Form T.Text m (Maybe T.Text)
maybeEmpty = fmap (\t -> if T.null $ T.strip t then Nothing else Just $ T.strip t)

optionalText :: Monad m => DF.Form T.Text m (Maybe T.Text)
optionalText =
    (\t -> if T.null (T.strip t) then Nothing else Just (T.strip t)) <$> DF.text Nothing

mustContainAtLeastOne :: Monad m => T.Text -> DF.Form T.Text m [a] -> DF.Form T.Text m (NE.NonEmpty a)
mustContainAtLeastOne errorMessage = DF.validate nonEmptyOrList
  where
    nonEmptyOrList list =
        if null list
            then DT.Error errorMessage
            else DT.Success $ NE.fromList list
