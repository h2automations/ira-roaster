import ExcelJS from "exceljs";
import { Team, Player } from "../generated-client/prisma";
import { PRODUCT_OPTIONS, isValidProductKey } from "./products";

export async function buildRosterWorkbook(params: {
  team: Team;
  players: Player[];
}): Promise<ExcelJS.Buffer> {
  const { team, players } = params;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "IRA Sportswear";

  // Sheet 1: Roster
  const rosterSheet = workbook.addWorksheet("Roster");
  const activeProducts = (team.enabledProducts || []).filter(isValidProductKey);

  const dynamicColumns = PRODUCT_OPTIONS.filter((p) =>
    activeProducts.includes(p.key)
  ).flatMap((p) => {
    const cols: { header: string; key: string; width: number }[] = [];
    if ("sizeField" in p) {
      cols.push({
        header: `${p.label} Size`,
        key: p.sizeField,
        width: 16
      });
    }
    if ("qtyField" in p) {
      cols.push({
        header: `${p.label} Qty`,
        key: p.qtyField,
        width: 14
      });
    }
    return cols;
  });

  rosterSheet.columns = [
    { header: "Team Name", key: "teamName", width: 30 },
    { header: "Roster Name", key: "rosterName", width: 30 },
    { header: "Player Name", key: "playerName", width: 30 },
    { header: "Jersey Number", key: "jerseyNumber", width: 15 },
    { header: "Gender", key: "gender", width: 12 },
    { header: "Sleeve Type", key: "sleeveType", width: 14 },
    ...dynamicColumns
  ];

  players.forEach((player) => {
    const baseRow = {
      teamName: team.name,
      rosterName: team.rosterName,
      playerName: player.name,
      jerseyNumber: player.jerseyNumber,
      gender: player.gender,
      sleeveType: player.sleeveType
    } as Record<string, string | number | null>;

    for (const product of PRODUCT_OPTIONS) {
      if (!activeProducts.includes(product.key)) continue;
      if ("sizeField" in product) {
        baseRow[product.sizeField] =
          (player as unknown as Record<string, string | null>)[product.sizeField] || "";
      }
      if ("qtyField" in product) {
        const qty = (player as unknown as Record<string, number | null>)[product.qtyField];
        baseRow[product.qtyField] = qty ?? 0;
      }
    }

    rosterSheet.addRow(baseRow);
  });

  // Sheet 2: Summary
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Team Name", key: "teamName", width: 30 },
    { header: "Manager Name", key: "managerName", width: 30 },
    { header: "Manager Email", key: "managerEmail", width: 35 },
    { header: "Created Date", key: "createdAt", width: 25 }
  ];

  summarySheet.addRow({
    teamName: team.name,
    managerName: team.managerName,
    managerEmail: team.managerEmail,
    createdAt: team.createdAt.toISOString()
  });

  const buffer = (await workbook.xlsx.writeBuffer()) as ExcelJS.Buffer;
  return buffer;
}
