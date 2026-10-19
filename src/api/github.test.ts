import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSearchQuery,
  buildSearchUrl,
  GitHubApiError,
  searchRepositories,
  type SearchParams,
} from "./github";

const params: SearchParams = {
  keyword: "react",
  language: "typescript",
  sort: "stars",
  page: 2,
};

function mockFetch(response: Response) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildSearchQuery", () => {
  it("combines the keyword with a language qualifier", () => {
    expect(buildSearchQuery("react", "typescript")).toBe(
      "react language:typescript",
    );
  });

  it("supports searching by language only", () => {
    expect(buildSearchQuery("", "rust")).toBe("language:rust");
  });
});

describe("buildSearchUrl", () => {
  it("includes query, sorting and pagination parameters", () => {
    const url = new URL(buildSearchUrl(params));

    expect(url.searchParams.get("q")).toBe("react language:typescript");
    expect(url.searchParams.get("sort")).toBe("stars");
    expect(url.searchParams.get("order")).toBe("desc");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("per_page")).toBe("20");
  });

  it("omits sorting for best match", () => {
    const url = new URL(buildSearchUrl({ ...params, sort: "best-match" }));

    expect(url.searchParams.has("sort")).toBe(false);
    expect(url.searchParams.has("order")).toBe(false);
  });
});

describe("searchRepositories", () => {
  it("returns the parsed response", async () => {
    const body = { total_count: 1, items: [] };
    mockFetch(new Response(JSON.stringify(body)));

    await expect(searchRepositories(params)).resolves.toEqual(body);
  });

  it("reports a rate limit", async () => {
    mockFetch(
      new Response(JSON.stringify({ message: "API rate limit exceeded" }), {
        status: 403,
        headers: { "x-ratelimit-remaining": "0" },
      }),
    );

    await expect(searchRepositories(params)).rejects.toMatchObject({
      kind: "rate-limit",
    });
  });

  it("reports other errors as HTTP errors", async () => {
    mockFetch(
      new Response(JSON.stringify({ message: "Validation Failed" }), {
        status: 422,
      }),
    );

    await expect(searchRepositories(params)).rejects.toMatchObject({
      kind: "http",
      status: 422,
      message: "Validation Failed",
    });
  });

  it("reports a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = await searchRepositories(params).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GitHubApiError);
    expect(error).toMatchObject({ kind: "network" });
  });
});
