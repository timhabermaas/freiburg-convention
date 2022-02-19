import { EventEnvelope, Event } from "~/types";
import { EventStore } from "./interface";
import { v4 as uuid } from "uuid";
import { logger as baseLogger } from "~/logger";
import pkg from "aws-sdk";
const { S3 } = pkg;

const BUCKET_NAME = "jonglieren-in-freiburg-dev";

const logger = baseLogger.child({ module: "S3Store" });

export class S3Store implements EventStore {
  private s3: pkg.S3;
  private fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
    this.s3 = new S3();
  }

  async readAll(): Promise<EventEnvelope<Event>[]> {
    try {
      logger.info(`Reading ${BUCKET_NAME}/${this.fileName} from S3`);

      const response = await this.s3
        .getObject({ Bucket: BUCKET_NAME, Key: this.fileName })
        .promise();

      if (response.$response.data) {
        logger.info(
          `Finished reading ${response.ContentLength} bytes from ${BUCKET_NAME}/${this.fileName} from S3`
        );
      } else {
        logger.error(
          `Failed reading ${BUCKET_NAME}/${this.fileName} from S3: ${response.$response.error}`
        );
        throw response.$response.error;
      }

      return JSON.parse(response.Body!.toString()).map(
        (e: EventEnvelope<Event>) => {
          // timeStamp is a string during runtime. Use io-ts or similar to
          // properly implement parsing/validating.
          // @ts-ignore
          return { ...e, timeStamp: new Date(Date.parse(e.timeStamp)) };
        }
      );
    } catch (e) {
      // TODO: AWSError doesn't seem to be backed by an actual class
      // (https://github.com/aws/aws-sdk-js/issues/2611)
      // @ts-ignore
      if (typeof e === "object" && e.code === "NoSuchKey") {
        logger.warn(
          `No key found under ${BUCKET_NAME}/${this.fileName}, returning empty array`
        );
        return [];
      } else {
        console.log(JSON.stringify(e));
        logger.error(`Failed reading ${BUCKET_NAME}/${this.fileName}: ${e}`);
        throw e;
      }
    }
  }

  async save(payload: Event): Promise<EventEnvelope<Event>> {
    const all = await this.readAll();
    const event = {
      payload,
      id: uuid(),
      version: all.length,
      timeStamp: new Date(),
    };

    all.push(event);

    const blob = JSON.stringify(all);

    logger.info(
      `Writing ${blob.length} bytes to ${BUCKET_NAME}/${this.fileName} from S3`
    );
    try {
      const response = await this.s3
        .putObject({
          Bucket: BUCKET_NAME,
          Key: this.fileName,
          Body: JSON.stringify(all),
        })
        .promise();
      if (response.$response.data) {
        logger.info(
          `Finished writing ${blob.length} bytes to ${BUCKET_NAME}/${this.fileName} from S3`
        );
      } else {
        logger.error(
          `Failed writing ${blob.length} bytes to ${BUCKET_NAME}/${this.fileName} from S3: ${response.$response.error}`
        );
        throw response.$response.error;
      }
    } catch (e) {
      logger.error(
        `Failed writing ${blob.length} bytes to ${BUCKET_NAME}/${this.fileName} from S3: ${e}`
      );
      throw e;
    }

    return event;
  }
}
