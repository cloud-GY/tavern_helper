// 配置开关
const IGNORE_TAGS = true; // 是否忽略 <标签>内容</标签> 格式
const COUNT_REASONING = true; // 是否统计思考内容

// 预编译正则表达式以提高性能
const TAG_PAIR_REGEX = /<([^>/\s]+)(?:\s+[^>]*)?>[\s\S]*?<\/\1>/g;
const SELF_CLOSING_TAG_REGEX = /<([^>/\s]+)(?:\s+[^>]*)?\/>/g;
const MAINTEXT_REGEX = /<maintext(?:\s+[^>]*)?>[\s\S]*?<\/maintext>/g;

function updateWordCount(messageId: number | string) {
  const id = Number(messageId);
  const messageElement = $(`.mes[mesid="${id}"]`);
  if (messageElement.length === 0) return;

  const tokenElement = messageElement.find('.tokenCounterDisplay');
  if (tokenElement.length === 0) return;

  const tokenMatch = tokenElement.text().match(/(\d+)t/);
  if (!tokenMatch) return;

  // 获取原始消息文本，避免 HTML 渲染干扰
  const chatMessages = getChatMessages(id);
  if (!chatMessages || chatMessages.length === 0) return;

  let content = chatMessages[0].message || '';

  if (IGNORE_TAGS) {
    // 移除 <标签>内容</标签>
    content = content.replace(TAG_PAIR_REGEX, '');
    // 移除自闭合标签 <标签 />
    content = content.replace(SELF_CLOSING_TAG_REGEX, '');
  }

  // 额外确保忽略 <maintext>
  content = content.replace(MAINTEXT_REGEX, '');

  const contentCount = content.length;
  let reasoningCount = 0;

  if (COUNT_REASONING) {
    // 思考内容通常在 extra.reasoning 中
    let reasoning = chatMessages[0].extra?.reasoning || '';
    if (IGNORE_TAGS) {
      reasoning = reasoning.replace(TAG_PAIR_REGEX, '');
      reasoning = reasoning.replace(SELF_CLOSING_TAG_REGEX, '');
    }
    reasoningCount = reasoning.length;
  }

  const tokenCount = tokenMatch[1];
  const newText =
    COUNT_REASONING && reasoningCount > 0
      ? `${tokenCount}t(${reasoningCount}+${contentCount})`
      : `${tokenCount}t(${contentCount})`;

  tokenElement.text(newText);
}

$(() => {
  eventOn(tavern_events.MESSAGE_RECEIVED, messageId => {
    setTimeout(() => updateWordCount(Number(messageId)), 200);
  });

  eventOn(tavern_events.MESSAGE_UPDATED, messageId => {
    setTimeout(() => updateWordCount(Number(messageId)), 200);
  });

  eventOn(tavern_events.STREAM_REASONING_DONE, (_, __, messageId) => {
    setTimeout(() => updateWordCount(messageId), 200);
  });
});
