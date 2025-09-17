import { SeparatorBuilder } from "discord.js";

export enum ContainerStyle {
  ERROR = "error",
  INFO = "info",
  SUCCESS = "success",
}

export enum MessageChunkType {
  CONTENT_BLOCK = "CONTENT_BLOCK",
  FOOTER_BLOCK = "FOOTER_BLOCK",
  MAIN_HEADER_BLOCK = "MAIN_HEADER_BLOCK",
}

export type ContainerComponent =
  | { type: "separator"; value: SeparatorBuilder }
  | { type: "text"; value: string };

export interface MessageBlock {
  content?: string[];
  header?: string;
  type: MessageChunkType;
  value?: string;
}
