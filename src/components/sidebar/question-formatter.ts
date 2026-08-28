/**
 * HTML 标签安全分词器
 */
export function extractOptionsSafely(html: string): Array<{ label: string; content: string }> {
  html = html.replace(/([A-D])．/g, '$1.');

  const regex = /(<[^>]+>)|(\s*\b[A-D]\.\s*)/g;
  const parts = html.split(regex);

  const options: Array<{ label: string; content: string }> = [];
  let currentOption: { label: string; content: string } | null = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === undefined || part === '') continue;

    const delimiterMatch = part.match(/^\s*\b([A-D])\.\s*$/);
    if (delimiterMatch) {
      const label = delimiterMatch[1];
      currentOption = { label, content: '' };
      options.push(currentOption);
    } else {
      if (currentOption) {
        currentOption.content += part;
      }
    }
  }
  return options;
}

/**
 * 智能提取选择题，自适应重构为响应式 MD3 选项卡片 (DOM 节点流版本)
 */
export function formatMultipleChoiceQuestions(root: ParentNode = document): void {
  const cardBodies = root.querySelectorAll('.card-body');
  if (cardBodies.length === 0) return;

  cardBodies.forEach((body) => {
    if (body.classList.contains('formatted-choices-v3')) return;

    const textContent = body.textContent || '';
    const hasA = /[A][\.．]\s*/.test(textContent);
    const hasB = /[B][\.．]\s*/.test(textContent);
    if (!hasA || !hasB) return;

    const childNodes = Array.from(body.childNodes);
    const questionNodes: Node[] = [];
    const optionNodes: Node[] = [];
    const trailingElements: Node[] = [];
    let foundA = false;
    let isProcessingTrailing = false;

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const isBlockComponent =
          el.classList.contains('analysis-block') ||
          el.classList.contains('note-block') ||
          el.classList.contains('fallback-block') ||
          el.classList.contains('conclusion-card') ||
          el.classList.contains('summary-card') ||
          el.classList.contains('method-card') ||
          el.classList.contains('guide-block') ||
          el.classList.contains('solution-details') ||
          el.classList.contains('knowledge-card');

        if (isBlockComponent) {
          isProcessingTrailing = true;
        }

        // 后置图片阻断机制
        if (foundA && !isProcessingTrailing) {
          const hasImg = el.tagName === 'IMG' || el.querySelector('img') !== null;
          const text = el.textContent || '';
          const isFigCaption = text.trim().match(/^图\s*(\d+\s*[-－]\s*\d+)$/) !== null;

          if (hasImg || isFigCaption) {
            isProcessingTrailing = true;
          }
        }
      }

      if (isProcessingTrailing) {
        trailingElements.push(node);
      } else {
        if (!foundA) {
          const nodeText = node.textContent || '';
          const aIndex = nodeText.search(/(?:^|[\s\.（\()停\s])A[\.．]/);

          if (aIndex !== -1) {
            foundA = true;

            if (node.nodeType === Node.TEXT_NODE) {
              const stemText = nodeText.substring(0, aIndex).trim();
              const optionsText = nodeText.substring(aIndex).trim();
              if (stemText) {
                questionNodes.push(document.createTextNode(stemText));
              }
              const optSpan = document.createElement('span');
              optSpan.innerHTML = optionsText;
              optionNodes.push(optSpan);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const html = el.innerHTML;
              const htmlMatch = html.match(/(?:\s+\.|\s+|^|[\(\)（）\s])(A[\.．])/);
              if (htmlMatch && htmlMatch.index !== undefined) {
                const htmlIndex = htmlMatch.index;
                let stemHtml = html.substring(0, htmlIndex).trim();
                const optionsHtml = html.substring(htmlIndex).trim();

                if (stemHtml.endsWith('.')) {
                  stemHtml = stemHtml.slice(0, -1).trim();
                }
                if (stemHtml) {
                  const stemElement = document.createElement(el.tagName);
                  stemElement.className = el.className;
                  stemElement.innerHTML = stemHtml;
                  questionNodes.push(stemElement);
                }
                const optElement = document.createElement('span');
                optElement.innerHTML = optionsHtml;
                optionNodes.push(optElement);
              } else {
                optionNodes.push(node);
              }
            }
          } else {
            questionNodes.push(node);
          }
        } else {
          optionNodes.push(node);
        }
      }
    }

    let combinedOptionsHtml = '';
    optionNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        combinedOptionsHtml += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        combinedOptionsHtml += (node as HTMLElement).outerHTML;
      }
    });

    const options = extractOptionsSafely(combinedOptionsHtml);

    if (options.length > 0) {
      body.innerHTML = '';
      body.classList.add('formatted-choices-v3');

      const stemContainer = document.createElement('div');
      stemContainer.className = 'question-stem';
      questionNodes.forEach((node) => {
        stemContainer.appendChild(node);
      });
      body.appendChild(stemContainer);

      let isLongText = false;
      options.forEach((opt) => {
        const pureText = opt.content.replace(/<[^>]+>/g, '').trim();
        if (pureText.length > 10) {
          isLongText = true;
        }
      });

      const optionsContainer = document.createElement('div');
      optionsContainer.className = `options-container ${isLongText ? 'options-vertical' : ''}`;

      options.forEach((opt) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'option-chip-wrapper';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'option-chip-label';
        labelSpan.textContent = opt.label;

        const contentSpan = document.createElement('span');
        contentSpan.className = 'option-chip-content';
        contentSpan.innerHTML = opt.content;

        wrapper.appendChild(labelSpan);
        wrapper.appendChild(contentSpan);
        optionsContainer.appendChild(wrapper);
      });
      body.appendChild(optionsContainer);

      trailingElements.forEach((el) => {
        body.appendChild(el);
      });
    }
  });
}
