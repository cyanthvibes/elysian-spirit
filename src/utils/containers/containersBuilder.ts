import {
  CHARACTER_LIMIT,
  MAX_COMPONENTS_PER_MESSAGE,
} from "constants/limits.js";
import {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import {
  ContainerComponent,
  ContainerStyle,
  MessageBlock,
  MessageChunkType,
} from "types/container.js";
import { getColorForStyle } from "utils/containers/containersUtils.js";

// Function that builds containers from blocks
export function buildContainers(
  style: ContainerStyle,
  blocks: MessageBlock[],
): ContainerBuilder[] {
  const containers: ContainerBuilder[] = [];
  let characterCount = 0;
  let componentCount = 0;
  let components: ContainerComponent[] = [];

  // Helper function to flush components to a container
  function flushContainer(): void {
    if (components.length === 0) return;

    // Set the colour for the container
    const container: ContainerBuilder = new ContainerBuilder().setAccentColor(
      getColorForStyle(style),
    );

    // For every component in the component array
    for (const comp of components) {
      // If the component is a text component, add it as a TextDisplayBuilder
      if (isText(comp)) {
        // Only add text components with non-empty content
        if (comp.value && comp.value.trim().length > 0) {
          container.addTextDisplayComponents(
            (): TextDisplayBuilder =>
              new TextDisplayBuilder().setContent(comp.value),
          );
        }

        // Else, the component is a separator, so add it as a SeparatorBuilder
      } else {
        container.addSeparatorComponents((): SeparatorBuilder => comp.value);
      }
    }

    // Push the container to the array of containers
    containers.push(container);
    components = [];
    characterCount = 0;
    componentCount = 0;
  }

  // Keep track of the index for blocks
  let blockIdx = 0;

  // If the first block is a main header block, add it
  if (
    blocks.length > 0 &&
    blocks[0].type === MessageChunkType.MAIN_HEADER_BLOCK
  ) {
    // The main header block should have a header and if it doesn't, set it to ""
    const header: string = blocks[0].value ?? "";

    // Add the main header block as a text component to the container
    components.push(textComponent(header));
    characterCount += header.length + 1;
    componentCount++;

    blockIdx = 1;

    // Add a separator if more blocks follow
    if (blocks.length > 1) {
      components.push(separatorComponent());
      characterCount += 1;
      componentCount++;
    }
  }

  // For-loop for all the blocks (except the first one)
  for (; blockIdx < blocks.length; blockIdx++) {
    const block: MessageBlock = blocks[blockIdx];

    // If the block is a content block
    if (block.type === MessageChunkType.CONTENT_BLOCK) {
      const contentLines: string[] = [];

      // If the content block has a header, push it to contentLines
      if (block.header) contentLines.push(block.header);

      // If the content block has content, push it to contentLines
      if (block.content) contentLines.push(...block.content);

      let chunk: string[] = [];
      let chunkCharacterCount = 0;

      // Checks for header and first line of content
      if (block.header && block.content && block.content.length > 0) {
        const header: string = block.header;
        const firstContentLine: string = block.content[0];
        const headerAndFirstLineLength: number =
          header.length + 1 + firstContentLine.length + 1;

        // If there is not enough space for both the header and the first line of content, flush first
        if (
          characterCount + headerAndFirstLineLength > CHARACTER_LIMIT ||
          componentCount + 1 > MAX_COMPONENTS_PER_MESSAGE - 1
        ) {
          flushContainer();
        }

        // Add the header and first content line
        chunk.push(header);
        chunkCharacterCount += header.length + 1;
        chunk.push(firstContentLine);
        chunkCharacterCount += firstContentLine.length + 1;

        // Remove the header and first content line
        contentLines.splice(0, 2);
      }

      // Check if the content block is the last content block and if a footer block follows
      const isLastContentBlockBeforeFooter: boolean =
        blockIdx === blocks.length - 2 &&
        blocks[blocks.length - 1].type === MessageChunkType.FOOTER_BLOCK;

      // For every contentLine in contentLines
      for (const contentLine of contentLines) {
        // Use splitLongText() for every contentLine so we don't get lines that go over the CHARACTER_LIMIT
        const lines: string[] = splitLongText(contentLine, CHARACTER_LIMIT);

        // For every line in lines
        for (const line of lines) {
          // If this block is the last content block, and the next block is a footer block,
          // check if adding the line would exceed the CHARACTER_LIMIT for this container if the footer is also added
          const shouldLineGoToNextContainer: boolean =
            isLastContentBlockBeforeFooter &&
            characterCount + chunkCharacterCount + line.length + 1 >
              CHARACTER_LIMIT -
                (blocks[blocks.length - 1].value?.length ?? 0) -
                2;

          // Check if adding the line would exceed the CHARACTER_LIMIT for this container
          const wouldAddingLineExceedCharacterLimit: boolean =
            characterCount + chunkCharacterCount + line.length + 1 >
            CHARACTER_LIMIT;

          // Check if adding the component would exceed the MAX_COMPONENTS_PER_MESSAGE for this container
          const wouldAddingComponentExceedComponentLimit: boolean =
            componentCount + 1 > MAX_COMPONENTS_PER_MESSAGE - 1;

          // If one of the three checks returns True
          if (
            wouldAddingLineExceedCharacterLimit ||
            wouldAddingComponentExceedComponentLimit ||
            shouldLineGoToNextContainer
          ) {
            // Add the chunk as a text component to the container (without adding the current line)
            // This way, the current line goes with the footer in the next container so the footer doesn't end up alone
            if (chunk.length > 0) {
              components.push({ type: "text", value: chunk.join("\n") });
              characterCount += chunkCharacterCount;
              componentCount++;
            }
            chunk = [];
            chunkCharacterCount = 0;

            flushContainer();
          }

          // Add the line to the chunk (either an empty chunk after flushContainer() or an already populated chunk)
          chunk.push(line);
          chunkCharacterCount += line.length + 1;
        }
      }

      // Add the chunk as a text component to the container
      if (chunk.length > 0) {
        components.push({ type: "text", value: chunk.join("\n") });
        characterCount += chunkCharacterCount;
        componentCount++;
      }

      // If the current content block is followed by another content block
      if (
        blockIdx < blocks.length - 1 &&
        blocks[blockIdx + 1].type === MessageChunkType.CONTENT_BLOCK
      ) {
        // Calculate if adding a separator and the header and/or content of the next block would exceed limits
        const nextBlock: MessageBlock = blocks[blockIdx + 1];

        const nextBlockHeaderLength: number = nextBlock.header
          ? nextBlock.header.length + 1
          : 0;

        const nextBlockFirstContentLength: number =
          nextBlock.content && nextBlock.content.length > 0
            ? nextBlock.content[0].length + 1
            : 0;

        const nextBlockLength: number =
          nextBlockHeaderLength + nextBlockFirstContentLength;

        // If adding a separator and the start of the next block would exceed limits, call flushContainers() first
        if (
          characterCount + 1 + nextBlockLength > CHARACTER_LIMIT ||
          componentCount + 1 > MAX_COMPONENTS_PER_MESSAGE - 1
        ) {
          flushContainer();

          // If there is room
        } else {
          // Add a separator component to the container only if there is a text component in the container
          if (
            components.length > 0 &&
            isText(components[components.length - 1])
          ) {
            components.push(separatorComponent());
            characterCount += 1;
            componentCount++;
          }
        }
      }

      // If the current block is a footer block
    } else if (block.type === MessageChunkType.FOOTER_BLOCK) {
      // All checks should've already been done so the footer can just be added
      const footerValue = block.value ?? "";

      if (footerValue.trim().length > 0) {
        components.push(textComponent(footerValue));
      }
    }
  }

  flushContainer();

  return containers;
}

// Function that creates a simple container from a string
export function createSimpleContainers(
  style: ContainerStyle,
  content: string,
): ContainerBuilder[] {
  const container = new ContainerBuilder();

  container.setAccentColor(getColorForStyle(style));

  // Only add content if it's not empty
  if (content && content.trim().length > 0) {
    container.addTextDisplayComponents(
      (): TextDisplayBuilder => new TextDisplayBuilder().setContent(content),
    );
  }

  return [container];
}

// Helper function that checks if a component is a text
function isText(
  comp: ContainerComponent,
): comp is { type: "text"; value: string } {
  return comp.type === "text";
}

// Helper function that returns a separator component
function separatorComponent(): ContainerComponent {
  return { type: "separator", value: new SeparatorBuilder() };
}

// Helper function that splits long text in the array of strings
function splitLongText(text: string, maxLen: number): string[] {
  const result: string[] = [];
  let start = 0;

  while (start < text.length) {
    result.push(text.slice(start, start + maxLen));
    start += maxLen;
  }

  return result;
}

// Helper function that returns a text component
function textComponent(value: string): ContainerComponent {
  return { type: "text", value };
}
