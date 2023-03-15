import { EventEnvelope, Event, EventEnvelopeArray } from "~/domain/events";
import { EventStore } from "./interface";
import { v4 as uuid } from "uuid";
import { logger as baseLogger } from "~/logger";
import pkg from "aws-sdk";
const { S3 } = pkg;

const logger = baseLogger.child({ module: "S3Store" });

export class S3Store implements EventStore {
  private s3: pkg.S3;
  private objectName: string;
  private bucketName: string;

  constructor(objectName: string, bucketName: string) {
    this.objectName = objectName;
    this.bucketName = bucketName;
    this.s3 = new S3({
      apiVersion: "2006-03-01",
      region: "eu-central-1",
      httpOptions: { timeout: 10000 },
    });
  }

  clear(): void {
    throw new Error("clearing store not supported");
  }

  async readAll(): Promise<EventEnvelope<Event>[]> {
    try {
      logger.info(
        `Reading ${this.bucketName}/${this.withExtension(
          this.objectName
        )} from S3`
      );

      const response = await this.s3
        .getObject({
          Bucket: this.bucketName,
          Key: this.withExtension(this.objectName),
        })
        .promise();

      if (response.$response.data) {
        logger.info(
          `Finished reading ${response.ContentLength} bytes from ${
            this.bucketName
          }/${this.withExtension(this.objectName)} from S3`
        );
      } else {
        logger.error(
          `Failed reading ${this.bucketName}/${this.withExtension(
            this.objectName
          )} from S3: ${response.$response.error}`
        );
        throw response.$response.error;
      }

      const raw = JSON.parse(response.Body!.toString());

      return EventEnvelopeArray.parse(raw);
    } catch (e) {
      // TODO: AWSError doesn't seem to be backed by an actual class
      // (https://github.com/aws/aws-sdk-js/issues/2611)
      // @ts-ignore
      if (typeof e === "object" && e.code === "NoSuchKey") {
        logger.warn(
          `No key found under ${this.bucketName}/${this.withExtension(
            this.objectName
          )}, returning empty array`
        );
        return [];
      } else {
        logger.error(
          `Failed reading ${this.bucketName}/${this.withExtension(
            this.objectName
          )}: ${e}`
        );
        throw e;
      }
    }
  }

  async save(
    payload: Event,
    versionNumber: number
  ): Promise<EventEnvelope<Event>> {
    const all = await this.readAll();
    const event = {
      payload,
      id: uuid(),
      version: versionNumber,
      timeStamp: new Date(),
    };

    all.push(event);

    const blob = JSON.stringify(all);

    logger.info(
      `Writing ${blob.length} bytes to ${this.bucketName}/${this.withExtension(
        this.objectName
      )} from S3`
    );
    try {
      const response = await this.s3
        .putObject({
          Bucket: this.bucketName,
          Key: this.withExtension(this.objectName),
          Body: JSON.stringify(all),
        })
        .promise();
      if (response.$response.data) {
        logger.info(
          `Finished writing ${blob.length} bytes to ${
            this.bucketName
          }/${this.withExtension(this.objectName)} from S3`
        );
      } else {
        logger.error(
          `Failed writing ${blob.length} bytes to ${
            this.bucketName
          }/${this.withExtension(this.objectName)} from S3: ${
            response.$response.error
          }`
        );
        throw response.$response.error;
      }
    } catch (e) {
      logger.error(
        `Failed writing ${blob.length} bytes to ${
          this.bucketName
        }/${this.withExtension(this.objectName)} from S3: ${e}`
      );
      throw e;
    }

    return event;
  }

  async backup(): Promise<void> {
    const source = `${this.bucketName}/${this.withExtension(this.objectName)}`;

    const currentTime = new Date().toISOString();
    const destination = this.withExtension(
      `${this.objectName}-backup-${currentTime}`
    );

    try {
      logger.info(`Backing up ${source} to ${destination}`);
      await this.s3
        .copyObject({
          Bucket: this.bucketName,
          CopySource: source,
          Key: destination,
        })
        .promise();
      logger.info("Backup successful.");
    } catch (e) {
      logger.error(`Failed backing up ${source} due to: ${e}`);
    }
  }

  private withExtension(name: string): string {
    return `${name}.json`;
  }
}
