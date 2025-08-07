export interface FigmaFileInfo {
  dataUrl: string;
  fileName: string;
  jsonData: string;
  cleanup: () => void;
}

/**
 * Creates a data URL containing Figma data
 */
export function createTempFigmaFile(figmaData: any): FigmaFileInfo {
  const fileName = `${figmaData.metadata?.frameName || 'Figma-Frame'}-${Date.now()}.json`;
  const jsonString = JSON.stringify(figmaData, null, 2);
  const dataUrl = `data:application/json;base64,${btoa(jsonString)}`;

  const cleanup = () => {
    /*
     * Data preserved for inspection purposes
     * JSON data is accessible through the jsonData property
     */
    console.log(`Figma data created for inspection:`, fileName);
    console.log(`JSON Data:`, jsonString);
  };

  return {
    dataUrl,
    fileName,
    jsonData: jsonString,
    cleanup,
  };
}

/**
 * Converts Figma data to an attachment format
 */
export function figmaFileToAttachment(figmaFileInfo: FigmaFileInfo) {
  return {
    name: figmaFileInfo.fileName,
    contentType: 'application/json',
    url: figmaFileInfo.dataUrl,
  };
}
