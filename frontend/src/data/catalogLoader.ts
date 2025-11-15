export const loadCatalog = async (major: string) => {
  switch (major) {
    case "BSComputerScience":
      return await import("./catalog - BSComputerScience.json");
    case "BSDataScience&A":
      return await import("./catalog - BSDataScience&A.json");
    case "BAComputerScience":
      return await import("./catalog - BAComputerScience.json");
    case "BSMechanical":
      return await import("./catalog-BSMechanical.json");
    case "BSCivil":
      return await import("./catalog - BSCivil.json");
    // add the rest…
    default:
      throw new Error("Unknown major: " + major);
  }
};
