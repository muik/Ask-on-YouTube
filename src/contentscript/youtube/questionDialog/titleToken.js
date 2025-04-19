import { textToInputClickListener } from "./textToInputClickListener.ts";

const TokenTypes = {
    INPUTABLE: "inputable",
    SEPARATOR: "separator",
};

export function getTitleTokens(inputString) {
    if (!inputString) {
        return [];
    }
    const tokens = [];
    const postTokens = [];

    const matched = inputString.match(/(.+)( \([^)]+\))$/);
    if (matched) {
        postTokens.push({ text: " ", type: TokenTypes.SEPARATOR });
        postTokens.push({
            text: matched[2].trim(),
            type: TokenTypes.INPUTABLE,
        });
        inputString = matched[1];
    }

    const separatorIndex = inputString.search(/( [|/] |[ㅣ])/);
    if (separatorIndex > -1) {
        const separatorSize = inputString[separatorIndex] === " " ? 3 : 1;
        tokens.push({
            text: inputString.substring(0, separatorIndex),
            type: TokenTypes.INPUTABLE,
        });
        tokens.push({
            text: inputString.substring(separatorIndex, separatorIndex + separatorSize),
            type: TokenTypes.SEPARATOR,
        });
        tokens.push({
            text: inputString.substring(separatorIndex + separatorSize),
            type: TokenTypes.INPUTABLE,
        });
    } else {
        tokens.push({ text: inputString, type: TokenTypes.INPUTABLE });
    }

    if (postTokens.length > 0) {
        tokens.push(...postTokens);
    }

    return tokens;
}

export function setTitleToken(titleElement) {
    return token => {
        const spanElement = document.createElement("span");
        spanElement.textContent = token.text;
        spanElement.classList.add(token.type);
        titleElement.appendChild(spanElement);

        if (token.type === TokenTypes.INPUTABLE) {
            spanElement.addEventListener("click", textToInputClickListener);
        }
    };
}
