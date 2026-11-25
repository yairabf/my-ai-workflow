export function checkHandoff(text, template, url, plan, briefName = 'brief.md') {
  if (/^BLOCKED\b/i.test(text)) throw new Error('Role blocked: ' + text.slice(0, 1000))
  const citations = text.match(/https?:\/\/[^\s<>"'`()\[\]]+/gi) ?? []
  if (!citations.some((citation) => citation.replace(/[.,;:!]+$/, '') === url)) {
    throw new Error('Role output does not reference the requested issue.')
  }
  for (const title of template.split('\n').filter((line) => line.startsWith('## '))) {
    const section = text.split('\n' + title + '\n')
    if (section.length !== 2 || !section[1].split('\n## ')[0].trim()) {
      throw new Error('Role returned an incomplete document. Expected one populated section for ' + title)
    }
  }
  const normalizedText = text.replace(/\s+/g, ' ')
  const placeholders = template.replace(/\s+/g, ' ').match(/<[^<>]+>/g) ?? []
  if (placeholders.some((placeholder) => normalizedText.includes(placeholder))) {
    throw new Error('Role returned an incomplete document with template placeholders.')
  }
  if (!plan) {
    const findings = text.split('\n## Verified findings\n')[1].split('\n## ')[0].trim()
    const [preamble, ...entries] = findings.split(/^[ \t]*[-*] \*\*Finding:\*\*[ \t]*/m)
    if (preamble.trim() || !entries.length)
      throw new Error('Expected findings in the investigation template format.')
    for (const entry of entries) {
      const [finding, evidence] = entry.split(/^[ \t]*[-*] \*\*Evidence:\*\*[ \t]*/m)
      const supportingText = evidence?.split(/^[ \t]*[-*] \*\*/m)[0].trim()
      if (!finding.trim() || !supportingText) throw new Error('Each verified finding needs supporting evidence.')
    }
  }
  if (plan) {
    const approval = text.split('\n## Human approval\n')[1].trim()
    const decisions = text.match(/^\*\*Decision:\*\*.*$/gm) ?? []
    if (
      decisions.length !== 1 ||
      !/^\*\*Decision:\*\* Pending[ \t]*$/m.test(approval) ||
      !text.includes(briefName)
    ) {
      throw new Error('Planner must reference the brief and return one pending human decision.')
    }
  }
}
