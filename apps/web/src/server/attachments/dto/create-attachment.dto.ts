import { IsString, MaxLength } from 'class-validator';

// Firestore hard-caps a document at 1MB. Base64 adds ~33% overhead, so a raw
// file must stay well under that — 700KB raw (~933KB encoded) leaves enough
// room for the document's other fields.
export const MAX_ATTACHMENT_BYTES = 700 * 1024;

export class CreateAttachmentDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsString()
  @MaxLength(100)
  mimeType!: string;

  @IsString()
  dataBase64!: string;
}
