import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

// Interface for Figma API responses
interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    gradientStops?: Array<{
      color: {
        r: number;
        g: number;
        b: number;
        a: number;
      };
      position: number;
    }>;
  }>;
  strokes?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  }>;
  strokeWeight?: number;
  cornerRadius?: number;
  children?: FigmaNode[];
  characters?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    textAlignHorizontal?: string;
    textAlignVertical?: string;
  };
  effects?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    offset?: {
      x: number;
      y: number;
    };
    radius?: number;
  }>;
  reactions?: Array<{
    trigger: {
      type: string;
    };
    actions: Array<{
      type: string;
      destinationId?: string;
      navigation?: string;
      transition?: {
        type: string;
        duration?: number;
        easing?: {
          type: string;
        };
        direction?: string;
      };
      url?: string;
      overlay?: {
        overlayPositionType: string;
      };
    }>;
  }>;
  transitionNodeID?: string;
}

interface FigmaFileResponse {
  document: FigmaNode;
  components: Record<string, any>;
  styles: Record<string, any>;
  name: string;
}

// Helper function to convert Figma color to CSS
function figmaColorToCss(color: { r: number; g: number; b: number; a: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a;

  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

// Helper function to convert Figma effects to CSS
function figmaEffectsToCss(effects: FigmaNode['effects']): string {
  if (!effects || effects.length === 0) {
    return '';
  }

  const shadows = effects
    .filter((effect) => effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW')
    .map((effect) => {
      const x = effect.offset?.x || 0;
      const y = effect.offset?.y || 0;
      const blur = effect.radius || 0;
      const color = effect.color ? figmaColorToCss(effect.color) : 'rgba(0, 0, 0, 0.1)';
      const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';

      return `${inset}${x}px ${y}px ${blur}px ${color}`;
    })
    .join(', ');

  return shadows ? `box-shadow: ${shadows};` : '';
}

// Helper function to find a specific node by ID
function findNodeById(node: FigmaNode, targetId: string): FigmaNode | null {
  if (node.id === targetId) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId);

      if (found) {
        return found;
      }
    }
  }

  return null;
}

// Helper function to detect interactive elements
function isInteractiveElement(node: FigmaNode): boolean {
  // Check if node has reactions (prototype interactions)
  if (node.reactions && node.reactions.length > 0) {
    return true;
  }

  // Check if node name suggests it's interactive
  const interactiveNames = ['button', 'btn', 'link', 'menu', 'nav', 'click', 'tap', 'toggle'];
  const nodeName = node.name.toLowerCase();

  return interactiveNames.some((keyword) => nodeName.includes(keyword));
}

// Helper function to get appropriate HTML tag for interactive elements
function getInteractiveTag(node: FigmaNode): string {
  const nodeName = node.name.toLowerCase();

  if (node.reactions?.some((r) => r.actions.some((a) => a.url))) {
    return 'a'; // Link
  }

  if (nodeName.includes('input') || nodeName.includes('field')) {
    return 'input';
  }

  if (nodeName.includes('textarea')) {
    return 'textarea';
  }

  if (isInteractiveElement(node)) {
    return 'button';
  }

  return 'div';
}

// Helper function to generate interaction JavaScript
function generateInteractionJS(node: FigmaNode, allNodes: Map<string, FigmaNode>): string {
  if (!node.reactions || node.reactions.length === 0) {
    return '';
  }

  const interactions: string[] = [];
  const nodeId = `figma-${node.id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  node.reactions.forEach((reaction) => {
    const trigger = reaction.trigger.type;
    const action = reaction.actions[0]; // Use first action for simplicity

    if (!action) {
      return;
    }

    let jsCode = '';

    // Handle different trigger types
    switch (trigger) {
      case 'ON_CLICK':
      case 'ON_TAP':
        jsCode = `document.getElementById('${nodeId}').addEventListener('click', function(e) {\n`;
        break;
      case 'WHILE_HOVERING':
      case 'MOUSE_ENTER':
        jsCode = `document.getElementById('${nodeId}').addEventListener('mouseenter', function(e) {\n`;
        break;
      case 'MOUSE_LEAVE':
        jsCode = `document.getElementById('${nodeId}').addEventListener('mouseleave', function(e) {\n`;
        break;
      default:
        return;
    }

    // Handle different action types
    switch (action.type) {
      case 'NODE':
        if (action.destinationId && allNodes.has(action.destinationId)) {
          const destinationNode = allNodes.get(action.destinationId)!;
          const destId = `figma-${destinationNode.id.replace(/[^a-zA-Z0-9]/g, '-')}`;

          if (action.navigation === 'NAVIGATE') {
            // Show/hide frames for navigation
            jsCode += `  // Navigate to frame\n`;
            jsCode += `  document.querySelectorAll('[data-figma-frame]').forEach(f => f.style.display = 'none');\n`;
            jsCode += `  const targetFrame = document.getElementById('${destId}');\n`;
            jsCode += `  if (targetFrame) {\n`;
            jsCode += `    targetFrame.style.display = 'block';\n`;

            // Add transition if specified
            if (action.transition) {
              const duration = (action.transition.duration || 0.3) * 1000;
              jsCode += `    targetFrame.style.opacity = '0';\n`;
              jsCode += `    targetFrame.style.transition = 'opacity ${duration}ms ease';\n`;
              jsCode += `    setTimeout(() => targetFrame.style.opacity = '1', 10);\n`;
            }

            jsCode += `  }\n`;
          } else if (action.overlay) {
            // Show overlay
            jsCode += `  // Show overlay\n`;
            jsCode += `  const overlay = document.getElementById('${destId}');\n`;
            jsCode += `  if (overlay) {\n`;
            jsCode += `    overlay.style.display = 'block';\n`;
            jsCode += `    overlay.style.position = 'fixed';\n`;
            jsCode += `    overlay.style.top = '50%';\n`;
            jsCode += `    overlay.style.left = '50%';\n`;
            jsCode += `    overlay.style.transform = 'translate(-50%, -50%)';\n`;
            jsCode += `    overlay.style.zIndex = '1000';\n`;
            jsCode += `    overlay.style.backgroundColor = 'white';\n`;
            jsCode += `    overlay.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';\n`;
            jsCode += `    overlay.style.borderRadius = '8px';\n`;
            jsCode += `  }\n`;
          }
        }

        break;
      case 'URL':
        if (action.url) {
          jsCode += `  window.open('${action.url}', '_blank');\n`;
        }

        break;
      case 'BACK':
        jsCode += `  history.back();\n`;
        break;
    }

    jsCode += `});\n\n`;
    interactions.push(jsCode);
  });

  return interactions.join('');
}

// Helper function to generate hover effects
function generateHoverEffects(node: FigmaNode): string {
  if (!isInteractiveElement(node)) {
    return '';
  }

  const nodeId = `figma-${node.id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return `
#${nodeId}:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;
}

#${nodeId}:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
`;
}

// Extract comprehensive Figma frame data for AI attachment
function extractDetailedFigmaData(node: FigmaNode): any {
  function processNode(currentNode: FigmaNode): any {
    const nodeData: any = {
      id: currentNode.id,
      name: currentNode.name,
      type: currentNode.type,
    };

    // Positioning and dimensions
    if (currentNode.absoluteBoundingBox) {
      nodeData.bounds = {
        x: currentNode.absoluteBoundingBox.x,
        y: currentNode.absoluteBoundingBox.y,
        width: currentNode.absoluteBoundingBox.width,
        height: currentNode.absoluteBoundingBox.height,
      };
    }

    // Text content and styling
    if (currentNode.type === 'TEXT' && currentNode.characters) {
      nodeData.text = {
        content: currentNode.characters,
        style: currentNode.style
          ? {
              fontSize: currentNode.style.fontSize,
              fontFamily: currentNode.style.fontFamily,
              fontWeight: currentNode.style.fontWeight,
              textAlign: currentNode.style.textAlignHorizontal,
            }
          : undefined,
      };
    }

    // Visual styling
    if (currentNode.fills && currentNode.fills.length > 0) {
      nodeData.fills = currentNode.fills.map((fill) => ({
        type: fill.type,
        color: fill.type === 'SOLID' && fill.color ? figmaColorToCss(fill.color) : undefined,
      }));
    }

    if (currentNode.strokes && currentNode.strokes.length > 0) {
      nodeData.strokes = currentNode.strokes.map((stroke) => ({
        type: stroke.type,
        color: stroke.type === 'SOLID' && stroke.color ? figmaColorToCss(stroke.color) : undefined,
      }));
      nodeData.strokeWeight = currentNode.strokeWeight;
    }

    // Corner radius
    if (currentNode.cornerRadius !== undefined) {
      nodeData.cornerRadius = currentNode.cornerRadius;
    }

    // Effects (shadows, blurs)
    if (currentNode.effects && currentNode.effects.length > 0) {
      nodeData.effects = currentNode.effects.map((effect) => ({
        type: effect.type,
        color: effect.color ? figmaColorToCss(effect.color) : undefined,
        offset: effect.offset,
        radius: effect.radius,
      }));
    }

    // Interactions
    if (currentNode.reactions && currentNode.reactions.length > 0) {
      nodeData.interactions = currentNode.reactions.map((reaction) => ({
        trigger: reaction.trigger.type,
        actions: reaction.actions.map((action) => ({
          type: action.type,
          destinationId: action.destinationId,
          url: action.url,
          navigation: action.navigation,
          transition: action.transition,
        })),
      }));
    }

    // Process children recursively
    if (currentNode.children && currentNode.children.length > 0) {
      nodeData.children = currentNode.children.map((child) => processNode(child));
    }

    return nodeData;
  }

  return processNode(node);
}

// Determine the type of application based on design analysis
function determineAppType(designContext: string, interactiveCount: number): string {
  const context = designContext.toLowerCase();

  if (context.includes('dashboard') || context.includes('analytics') || context.includes('chart')) {
    return 'React dashboard application';
  }

  if (context.includes('landing') || context.includes('hero') || context.includes('marketing')) {
    return 'React landing page';
  }

  if (
    context.includes('form') ||
    context.includes('input') ||
    context.includes('signup') ||
    context.includes('login')
  ) {
    return 'React form application';
  }

  if (context.includes('card') || context.includes('product') || context.includes('catalog')) {
    return 'React product showcase';
  }

  if (context.includes('blog') || context.includes('article') || context.includes('content')) {
    return 'React blog application';
  }

  if (interactiveCount > 3) {
    return 'React interactive web application';
  }

  return 'React web application';
}

// Generate data for the new attachment-based approach
function generateFigmaImportData(
  targetNode: FigmaNode,
  figmaData: FigmaFileResponse,
  allNodes: Map<string, FigmaNode>,
) {
  // Extract detailed Figma data for attachment
  const figmaFrameData = extractDetailedFigmaData(targetNode);

  // Count interactive elements
  const interactiveCount = Array.from(allNodes.values()).filter((node) => isInteractiveElement(node)).length;

  // Extract color palette (limited for text prompt)
  const colors = new Set<string>();

  function extractColors(node: FigmaNode) {
    if (node.fills) {
      node.fills.forEach((fill) => {
        if (fill.type === 'SOLID' && fill.color) {
          colors.add(figmaColorToCss(fill.color));
        }
      });
    }

    if (node.children) {
      node.children.forEach(extractColors);
    }
  }

  extractColors(targetNode);

  // Create a simple, user-friendly prompt (what user will see and can edit)
  const frameName = targetNode.name || 'Figma Design';
  const bounds = targetNode.absoluteBoundingBox;
  const appType = determineAppType('', interactiveCount); // Simplified determination

  const simplePrompt = `Build a ${appType} based on the Figma frame "${frameName}"${bounds ? ` (${bounds.width}x${bounds.height}px)` : ''}.

Please replicate the exact design, layout, styling, and interactions${interactiveCount > 0 ? ` (${interactiveCount} interactive elements)` : ''} using React, TypeScript, and Tailwind CSS.`;

  return {
    prompt: simplePrompt,
    figmaData: {
      ...figmaFrameData,
      metadata: {
        frameName,
        originalUrl: figmaData.name,
        nodeId: targetNode.id,
        dimensions: bounds ? { width: bounds.width, height: bounds.height } : null,
        colorPalette: Array.from(colors),
        interactiveElementsCount: interactiveCount,
        extractedAt: new Date().toISOString(),
      },
    },
  };
}

// Convert Figma node to HTML/CSS with interactive features (kept for fallback)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function nodeToHtml(
  node: FigmaNode,
  isRoot = false,
  allNodes?: Map<string, FigmaNode>,
): { html: string; css: string; js: string } {
  const id = `figma-${node.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  let html = '';
  let css = '';
  let js = '';

  const bounds = node.absoluteBoundingBox;

  if (!bounds && !isRoot) {
    return { html: '', css: '', js: '' };
  }

  // Generate CSS styles
  const styles: string[] = [];

  if (bounds) {
    if (isRoot) {
      styles.push(`width: ${bounds.width}px`);
      styles.push(`height: ${bounds.height}px`);
      styles.push('position: relative');
    } else {
      styles.push(`position: absolute`);
      styles.push(`left: ${bounds.x}px`);
      styles.push(`top: ${bounds.y}px`);
      styles.push(`width: ${bounds.width}px`);
      styles.push(`height: ${bounds.height}px`);
    }
  }

  // Handle fills (background)
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];

    if (fill.type === 'SOLID' && fill.color) {
      styles.push(`background-color: ${figmaColorToCss(fill.color)}`);
    } else if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
      const stops = fill.gradientStops
        .map((stop) => `${figmaColorToCss(stop.color)} ${stop.position * 100}%`)
        .join(', ');
      styles.push(`background: linear-gradient(90deg, ${stops})`);
    }
  }

  // Handle strokes (border)
  if (node.strokes && node.strokes.length > 0) {
    const stroke = node.strokes[0];

    if (stroke.color) {
      styles.push(`border: ${node.strokeWeight || 1}px solid ${figmaColorToCss(stroke.color)}`);
    }
  }

  // Handle corner radius
  if (node.cornerRadius) {
    styles.push(`border-radius: ${node.cornerRadius}px`);
  }

  // Handle effects (shadows)
  const effectsCss = figmaEffectsToCss(node.effects);

  if (effectsCss) {
    styles.push(effectsCss.replace('box-shadow: ', '').replace(';', ''));
    styles[styles.length - 1] = `box-shadow: ${styles[styles.length - 1]}`;
  }

  // Handle text styles
  if (node.type === 'TEXT' && node.style) {
    if (node.style.fontSize) {
      styles.push(`font-size: ${node.style.fontSize}px`);
    }

    if (node.style.fontFamily) {
      styles.push(`font-family: "${node.style.fontFamily}"`);
    }

    if (node.style.fontWeight) {
      styles.push(`font-weight: ${node.style.fontWeight}`);
    }

    if (node.style.textAlignHorizontal) {
      styles.push(`text-align: ${node.style.textAlignHorizontal.toLowerCase()}`);
    }

    styles.push('display: flex');
    styles.push('align-items: center');
    styles.push('justify-content: center');
  }

  css += `#${id} {\n  ${styles.join(';\n  ')};\n}\n\n`;

  // Add hover effects for interactive elements
  css += generateHoverEffects(node);

  // Determine appropriate HTML tag for interactive elements
  const htmlTag = getInteractiveTag(node);
  let attributes = `id="${id}"`;

  // Add frame attribute for navigation
  if (node.type === 'FRAME') {
    attributes += ` data-figma-frame="true"`;

    if (!isRoot) {
      attributes += ` style="display: none;"`;
    }
  }

  // Add interactive attributes
  if (isInteractiveElement(node)) {
    attributes += ` role="${htmlTag === 'button' ? 'button' : 'link'}"`;
    attributes += ` tabindex="0"`;

    // Add href for links
    if (htmlTag === 'a' && node.reactions?.some((r) => r.actions.some((a) => a.url))) {
      const urlAction = node.reactions.find((r) => r.actions.some((a) => a.url))?.actions.find((a) => a.url);

      if (urlAction?.url) {
        attributes += ` href="${urlAction.url}" target="_blank"`;
      }
    }
  }

  // Generate JavaScript for interactions
  if (allNodes) {
    js += generateInteractionJS(node, allNodes);
  }

  // Generate HTML
  if (node.type === 'TEXT' && node.characters) {
    html = `<${htmlTag} ${attributes}>${node.characters}</${htmlTag}>`;
  } else {
    const childResults = node.children ? node.children.map((child) => nodeToHtml(child, false, allNodes)) : [];

    const childrenHtml = childResults.map((result) => result.html).join('');
    const childrenCSS = childResults.map((result) => result.css).join('');
    const childrenJS = childResults.map((result) => result.js).join('');

    html = `<${htmlTag} ${attributes}>${childrenHtml}</${htmlTag}>`;
    css += childrenCSS;
    js += childrenJS;
  }

  return { html, css, js };
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const requestBody = (await request.json()) as {
      fileKey?: string;
      nodeId?: string;
      figmaUrl?: string;
      directJsonData?: any;
      importType?: string;
    };
    const { fileKey, nodeId, figmaUrl, directJsonData, importType } = requestBody;

    // Handle direct JSON data upload (legacy support - now handled client-side)
    if (importType === 'json' && directJsonData) {
      return json(
        {
          error: 'JSON file upload is now handled client-side with attachments',
        },
        { status: 400 },
      );
    }

    if (!fileKey) {
      return json({ error: 'File key is required' }, { status: 400 });
    }

    // Get Figma access token from environment
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;

    if (!figmaToken) {
      return json(
        {
          error: 'Figma access token not configured. Please add FIGMA_ACCESS_TOKEN to your environment variables.',
        },
        { status: 500 },
      );
    }

    // Fetch the Figma file
    const figmaApiUrl = `https://api.figma.com/v1/files/${fileKey}`;
    const response = await fetch(figmaApiUrl, {
      headers: {
        'X-Figma-Token': figmaToken,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        return json(
          {
            error: 'Access denied. Please ensure the Figma file is public or the access token has proper permissions.',
          },
          { status: 403 },
        );
      }

      if (response.status === 404) {
        return json({ error: 'Figma file not found. Please check the URL.' }, { status: 404 });
      }

      return json(
        {
          error: `Failed to fetch Figma file: ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    const figmaData: FigmaFileResponse = await response.json();

    // Find the target node (frame) to convert
    let targetNode = figmaData.document;

    if (nodeId) {
      // Clean up the node ID - sometimes it comes with extra encoding
      const cleanNodeId = decodeURIComponent(nodeId).replace(/:/g, '-');
      let foundNode = findNodeById(figmaData.document, nodeId);

      // Try with cleaned node ID if first attempt failed
      if (!foundNode && cleanNodeId !== nodeId) {
        foundNode = findNodeById(figmaData.document, cleanNodeId);
      }

      if (foundNode) {
        targetNode = foundNode;
      } else {
        console.warn(`Node with ID ${nodeId} not found, using root document`);

        // Fall back to first frame instead of root document
        const firstFrame = figmaData.document.children?.find((child) => child.type === 'FRAME');

        if (firstFrame) {
          targetNode = firstFrame;
        }
      }
    } else {
      // If no nodeId, try to find the first frame
      const firstFrame = figmaData.document.children?.find((child) => child.type === 'FRAME');

      if (firstFrame) {
        targetNode = firstFrame;
      }
    }

    // Create a map of all nodes for interaction handling
    const allNodes = new Map<string, FigmaNode>();

    function mapAllNodes(node: FigmaNode) {
      allNodes.set(node.id, node);

      if (node.children) {
        node.children.forEach(mapAllNodes);
      }
    }

    mapAllNodes(figmaData.document);

    // Generate data for attachment-based approach
    const importData = generateFigmaImportData(targetNode, figmaData, allNodes);

    return json({
      type: 'figma_import',
      prompt: importData.prompt,
      figmaData: importData.figmaData,
      metadata: {
        name: targetNode.name || figmaData.name,
        fileName: figmaData.name,
        nodeId: targetNode.id,
        figmaUrl,
        frameName: targetNode.name,
      },
    });
  } catch (error) {
    console.error('Error processing Figma import:', error);
    return json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}
