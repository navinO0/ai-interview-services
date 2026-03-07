/**
 * Cleans up and parses JSON from AI responses that might contain markdown or be truncated.
 */
export function safeJsonParse(text: string): any {
    try {
        // 1. Initial attempt
        return JSON.parse(text);
    } catch (e) {
        // 2. Try extracting from markdown JSON blocks
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const potentialJson = jsonMatch[1] || jsonMatch[0];
            try {
                return JSON.parse(potentialJson);
            } catch (innerError) {
                // 3. Last-ditch: Minimal "Repair" for truncated JSON
                // If it ends mid-string, try adding a closing quote and braces
                try {
                    let repaired = potentialJson.trim();
                    // If it ends with a comma, remove it
                    if (repaired.endsWith(',')) repaired = repaired.slice(0, -1);

                    // Balance braces/brackets
                    const openBraces = (repaired.match(/\{/g) || []).length;
                    const closeBraces = (repaired.match(/\}/g) || []).length;
                    const openBrackets = (repaired.match(/\[/g) || []).length;
                    const closeBrackets = (repaired.match(/\]/g) || []).length;

                    // If it was cut off mid-assignment (e.g. "key": "val)
                    const lastQuote = repaired.lastIndexOf('"');
                    const lastBrace = repaired.lastIndexOf('}');
                    if (lastQuote > lastBrace) {
                        repaired += '"'; // Close the open string
                    }

                    for (let i = 0; i < (openBraces - closeBraces); i++) repaired += '}';
                    for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += ']';

                    return JSON.parse(repaired);
                } catch (repairError) {
                    console.error('Final JSON repair failed:', repairError);
                    throw new Error('MALFORMED_AI_RESPONSE');
                }
            }
        }
        throw new Error('NO_JSON_FOUND_IN_AI_RESPONSE');
    }
}
