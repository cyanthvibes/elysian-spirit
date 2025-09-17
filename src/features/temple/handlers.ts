import { modifyClanPoints } from "database/repositories/clanPoints/actionRepository.js";
import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  GuildMember,
  MessageFlags,
} from "discord.js";
import { SpreadsheetRow } from "src/features/spreadsheet/types.js";
import { readSpreadsheetData } from "src/features/spreadsheet/utils.js";
import { buildTempleResultsContainers } from "src/features/temple/messageBuilder.js";
import { TEMPLE_MESSAGES } from "src/features/temple/messages.js";
import { processTempleCompetition } from "src/features/temple/processor.js";
import {
  ClanPointsConfig,
  ProcessedTempleParticipant,
  TempleAPIResponse,
  TempleAwardedMember,
  TempleCompetitionData,
  TempleParticipant,
  TempleResult,
} from "src/features/temple/types.js";
import { fetchTempleData } from "src/features/temple/utils.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { sendInteractionContainers } from "utils/containers/containersUtils.js";

// Function that handles /temple
export async function handleTempleInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.guild) return;

  // Get arguments from the interaction
  const competitionID: number = interaction.options.getInteger(
    "competition_id",
    true,
  );
  const gainPerClanPoint: number = interaction.options.getNumber(
    "gain_per_clan_point",
    true,
  );
  const maxPerPerson: number = interaction.options.getInteger(
    "max_clan_points",
    true,
  );
  const firstPlaceCap: number = interaction.options.getInteger(
    "first_place_cap",
    true,
  );
  const secondPlaceCap: number = interaction.options.getInteger(
    "second_place_cap",
    true,
  );
  const thirdPlaceCap: number = interaction.options.getInteger(
    "third_place_cap",
    true,
  );

  await interaction.reply({
    components: createSimpleContainers(
      ContainerStyle.INFO,
      TEMPLE_MESSAGES.FIRST_REPLY_HEADER,
    ),
    flags: MessageFlags.IsComponentsV2,
  });

  // Fetch data from TempleOSRS
  const templeResponse: TempleAPIResponse =
    await fetchTempleData(competitionID);

  // Add placements to participants and use capitalisation when available
  const participantsWithPlacement: ProcessedTempleParticipant[] =
    templeResponse.data.participants.map(
      (
        participant: TempleParticipant,
        index: number,
      ): ProcessedTempleParticipant => ({
        gain: participant.gain,
        placement: index + 1,
        player_name_with_capitalization:
          participant.player_name_with_capitalization,
        username:
          participant.player_name_with_capitalization || participant.username,
      }),
    );

  const templeData: TempleCompetitionData = {
    competitionName:
      templeResponse.data.info.name || `Competition ${competitionID}`,
    isSkillCompetition: templeResponse.data.info.skill_competition === 1,
    participants: participantsWithPlacement,
  };

  // Read spreadsheet data
  const rows: SpreadsheetRow[] = await readSpreadsheetData(
    interaction.guild.id,
  );

  // Get all guild members (excluding bots)
  const members: GuildMember[] = Array.from(
    interaction.guild.members.cache.values(),
  ).filter((member: GuildMember): boolean => !member.user.bot);

  const config: ClanPointsConfig = {
    firstPlaceCap,
    gainPerClanPoint,
    maxPerPerson,
    secondPlaceCap,
    thirdPlaceCap,
  };

  const result: TempleResult = await processTempleCompetition(
    rows,
    templeData,
    config,
    members,
    interaction.guild,
  );

  let transactionID: string | undefined;
  let finalBalances: Map<string, number> | undefined;

  // Award clan points to eligible members
  if (result.awarded.length > 0) {
    const discordIDs: string[] = result.awarded.map(
      (awarded: TempleAwardedMember): string => awarded.discordID,
    );

    const amounts: number[] = result.awarded.map(
      (awarded: TempleAwardedMember): number => awarded.cappedPoints,
    );

    const reason = `TempleOSRS competition ${competitionID}`;

    const clanPointsResult: {
      finalBalances: Map<string, number>;
      startingBalances: Map<string, number>;
      transactionID: string;
    } = await modifyClanPoints(
      interaction.guild,
      ActionType.TEMPLE,
      discordIDs,
      amounts,
      reason,
      interaction.user.id,
    );

    transactionID = clanPointsResult.transactionID;
    finalBalances = clanPointsResult.finalBalances;
  }

  // Always build and send containers (even if no one was awarded points)
  const containers: ContainerBuilder[] = buildTempleResultsContainers(
    interaction.guild.id,
    templeData.competitionName,
    result,
    templeData.isSkillCompetition,
    transactionID,
    finalBalances,
  );

  await sendInteractionContainers(interaction, containers, true);
}
