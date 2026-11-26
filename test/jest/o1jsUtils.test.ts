jest.mock("mina-attestations", () => ({
  PrettyPrinter: { simplifyCredentialData: jest.fn() },
}), { virtual: true });
jest.mock("mina-attestations/validation", () => ({
  PresentationRequestSchema: {},
  StoredCredentialSchema: {},
}), { virtual: true });

import { PrettyPrinter } from "mina-attestations";
import { getSimplifyCredentialData } from "../../src/utils/o1jsUtils";

describe("credential display data", () => {
  it("preserves named fields", () => {
    const data = { age: "18", active: false };
    (PrettyPrinter.simplifyCredentialData as jest.Mock).mockReturnValue(data);
    expect(getSimplifyCredentialData({})).toEqual(data);
  });

  it.each([0, false, "", "Alice", ["a", "b"]].map((data) => ({ data })))(
    "preserves scalar and array data: %j",
    ({ data }) => {
      (PrettyPrinter.simplifyCredentialData as jest.Mock).mockReturnValue(data);
      expect(getSimplifyCredentialData({})).toEqual({ value: data });
    }
  );

  it("handles absent data", () => {
    (PrettyPrinter.simplifyCredentialData as jest.Mock).mockReturnValue(null);
    expect(getSimplifyCredentialData({})).toEqual({});
  });
});
