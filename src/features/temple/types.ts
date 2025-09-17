import { SpreadsheetValidationError } from "src/features/spreadsheet/types.js";

export interface ClanPointsConfig {
  firstPlaceCap: number;
  gainPerClanPoint: number;
  maxPerPerson: number;
  secondPlaceCap: number;
  thirdPlaceCap: number;
}

export interface ProcessedTempleParticipant {
  gain: number;
  placement: number;
  player_name_with_capitalization: null | string;
  username: string;
}

export interface TempleAPIResponse {
  data: {
    info: {
      name: string;
      skill_competition: number;
    };
    participants: TempleParticipant[];
  };
}

export interface TempleAwardedMember {
  bestPlacement: number;
  calculatedPoints: number;
  cappedPoints: number;
  capReason?: string;
  discordID: string;
  placements: ProcessedTempleParticipant[];
  totalGain: number;
}

export interface TempleCompetitionData {
  competitionName: string;
  isSkillCompetition: boolean;
  participants: ProcessedTempleParticipant[];
}

export interface TempleInvalidMember {
  bestPlacement: number;
  calculatedPoints: number;
  cappedPoints: number;
  capReason?: string;
  discordID?: string;
  placements: ProcessedTempleParticipant[];
  rsnName: string;
  totalGain: number;
  validationErrors?: SpreadsheetValidationError[];
}

export interface TempleNotInSpreadsheetMember {
  bestPlacement: number;
  calculatedPoints: number;
  cappedPoints: number;
  capReason?: string;
  gain: number;
  placement: number;
  totalGain: number;
  username: string;
}

export interface TempleParticipant {
  gain: number;
  player_name_with_capitalization: null | string;
  username: string;
}

export interface TempleResult {
  awarded: TempleAwardedMember[];
  invalidSpreadsheetData: TempleInvalidMember[];
  missingRole: TempleInvalidMember[];
  notInSpreadsheet: TempleNotInSpreadsheetMember[];
  summary: {
    affectedErrorsByRow: Map<number, SpreadsheetValidationError[]>;
    awardedCount: number;
    invalidDataCount: number;
    missingRoleCount: number;
    notInSpreadsheetCount: number;
    totalParticipants: number;
    totalPointsAwarded: number;
  };
}
