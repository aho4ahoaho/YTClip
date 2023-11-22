import { type ParsedQs } from "qs";

export const getQueryString = (query: ParsedQs[string]): string | null => {
    if (typeof query === "string") {
        return query;
    } else if (Array.isArray(query)) {
        return String(query[0]);
    } else {
        return null;
    }
};

export const NormalizeUrl = (rawURL: string): string => {
    const url = new URL(rawURL);
    let id: string | null;
    if (url.hostname === "youtu.be") {
        id = url.pathname.substring(1);
    } else {
        id = url.searchParams.get("v");
    }
    if (!id) {
        throw new Error("Invalid URL");
    }
    return `https://youtu.be/${id}`;
};
