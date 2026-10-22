import { PrismaClient, ItemStatus } from '@prisma/client';

const prisma = new PrismaClient();

const rawCsv = `,,,,,,,,,,,,,
,S.No,Product Code,Product Description,Picture,Supplier,BOM,Standard Cost,Currency,Unit,Landed cost,Standard Price,Lead Time,Status
,1,MVG-IN-CON-M08-J8-01,Inductive Sensors-M8-2/4/6 mm-NPN/PNP NO/NC,,KJT,Material Code,,USD,10,,,3 Days,Active
,2,MVG-IN-CON-M08-J8-02,Inductive Sensors-M8-2/4/6 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,3,MVG-IN-CON-M08-J8M-01,Inductive Sensors-M8-1/2/3 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,4,MVG-IN-CON-M08-J8D-01,Inductive Sensors-M8-1/2/3 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,5,MVG-IN-CON-M12-J12-01,Inductive Sensors-M12-4 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,6,MVG-IN-CON-M12-J12-02,Inductive Sensors-M12-4 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,7,MVG-IN-CON-M12-J12M-01,Inductive Sensors-M12-2 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,8,MVG-IN-CON-M12-J12M-02,Inductive Sensors-M12-1/2/3 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,9,MVG-IN-CON-M18-J18-01,Inductive Sensors-M18-8 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,10,MVG-IN-CON-M18-J18-02,Inductive Sensors-M18-8 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,11,MVG-IN-CON-M18-J18-03,Inductive Sensors-M18-5/8/12 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,12,MVG-IN-CON-M18-J18M-01,Inductive Sensors-M18-5 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,13,MVG-IN-CON-M30-J30-01,Inductive Sensors-M30-15 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,14,MVG-IN-CON-M30-J30-02,Inductive Sensors-M30-15 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,15,MVG-IN-CON-M30-J30M-01,Inductive Sensors-M30-10 mm-NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,16,MVG-IN-EXD-J6.5MT-01,Inductive Sensors-J6.5MT-2/3 mm NPN/PNP NO/NC,,KJT,,,USD,5,,,3 Days,Active
,17,MVG-IN-EXD-J6.5MT-02,Inductive Sensors-J6.5MT-4/6 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,18,MVG-IN-EXD-J8MT-01,Inductive Sensors-J8MT-2/3 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,19,MVG-IN-EXD-J12MT-01,Inductive Sensors-J12MT-4/6 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,20,MVG-IN-EXD-J12T-01,Inductive Sensors-J12T-8/12 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,21,MVG-IN-EXD-J18T-01,Inductive Sensors-J18T-16/20 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,22,MVG-IN-EXD-J18MT-01,Inductive Sensors-J18MT-8/12 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,23,MVG-IN-EXD-J30T-01,Inductive Sensors-J30T-25/40 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,24,MVG-IN-EXD-J30T-02,Inductive Sensors-J30T-25/40 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,25,MVG-IN-EXD-J30T-03,Inductive Sensors-J30T-15/22 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,26,MVG-IN-EXD-J30T-04,Inductive Sensors-J30T-20/25 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,27,MVG-IN-ANL-WJ12C-01,Inductive Sensors-WJ12C-0.1-3 mm PNP ANALOG,,KJT,,,USD,2,,,3 Days,Active
,28,MVG-IN-ANL-WJ12C-02,Inductive Sensors-WJ12C-0.1-4 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,29,MVG-IN-ANL-WJ12C-03,Inductive Sensors-WJ12C-1-4 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,30,MVG-IN-ANL-WJ18C-01,Inductive Sensors-WJ18C-0.1-5 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,31,MVG-IN-ANL-WJ18C-02,Inductive Sensors-WJ18C-0.1-8 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,32,MVG-IN-ANL-WJ18C-03,Inductive Sensors-WJ18C-1-4 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,33,MVG-IN-ANL-WJ18C-04,Inductive Sensors-WJ18C-1-7 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,34,MVG-IN-ANL-WJ30C-01,Inductive Sensors-WJ30C-0.1-13 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,35,MVG-IN-ANL-WJ30C-02,Inductive Sensors-WJ30C-7-14 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,36,MVG-IN-ANL-WJ30C-03,Inductive Sensors-WJ30C-5-10 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,37,MVG-IN-ANL-WJ30C-04,Inductive Sensors-WJ30C-5-10 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,38,MVG-IN-ANL-WJ40C-01,Inductive Sensors-WJ40C-5-10 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,39,MVG-IN-ANL-WJ40C-02,Inductive Sensors-WJ40C-5-15 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,40,MVG-IN-ANL-WJ40C-03,Inductive Sensors-WJ40C-5-20 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,41,MVG-IN-ANL-WJ40C-04,Inductive Sensors-WJ40C-10-30 mm PNP ANALOG,,KJT,,,USD,,,,3 Days,Active
,42,MVG-IN-ANL-M30*61.5-01,Inductive Sensors-M30*61.5-1-10 mm Output NM,,KJT,,,USD,,,,3 Days,Active
,43,MVG-IN-ANL-M30*69.5-01,Inductive Sensors-M30*69.5-1.6-15 mm Output NM,,KJT,,,USD,,,,3 Days,Active
,44,MVG-IN-FIS-J8MQS-01,Inductive Sensors-J8MQS-1/2 mm NPN/PNP NO/NC,,KJT,,,USD,2,,,3 Days,Active
,45,MVG-IN-FIS-J8QS-01,Inductive Sensors-J8QS-2 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,46,MVG-IN-FIS-J8QS-02,Inductive Sensors-J8QS-15 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,47,MVG-IN-FIS-J12MQS-01,Inductive Sensors-J12MQS-2/4 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,48,MVG-IN-FIS-J12QS-01,Inductive Sensors-J12QS-4 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,49,MVG-IN-FIS-J12QS-02,Inductive Sensors-J12QS-2/4 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,50,MVG-IN-FIS-J18MQS-01,Inductive Sensors-J18MQS-5/8 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,51,MVG-IN-FIS-J18QS-01,Inductive Sensors-J18QS-8 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,52,MVG-IN-FIS-J30MQS-01,Inductive Sensors-J30MQS-10 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,53,MVG-IN-FIS-J30QS-01,Inductive Sensors-J30QS-15 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,54,MVG-IN-HTS-J8GW-01,Inductive Sensors-J8GW-1 mm NPN/PNP NO/NC,,KJT,,,USD,2,,,3 Days,Active
,55,MVG-IN-HTS-J8GW-02,Inductive Sensors-J8GW-2 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,56,MVG-IN-HTS-J12GW-01,Inductive Sensors-J12GW-1 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,57,MVG-IN-HTS-J18GW-01,Inductive Sensors-J18GW-1 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,58,MVG-IN-HTS-J18GW-02,Inductive Sensors-J18GW-5 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,59,MVG-IN-HTS-J18GW-03,Inductive Sensors-J18GW-8 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,60,MVG-IN-HTS-J18GW-04,Inductive Sensors-J18GW-5/8 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,61,MVG-IN-HTS-J30GWM-01,Inductive Sensors-J30GWM-10 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,62,MVG-IN-HTS-J30GWN-01,Inductive Sensors-J30GWN-10 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,63,MVG-IN-HTS-J30GW-01,Inductive Sensors-J30GW-1 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,64,MVG-IN-HTS-J30GW-02,Inductive Sensors-J30GW-5-8 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,65,MVG-IN-HTS-J30GW-03,Inductive Sensors-J30GW-15 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,66,MVG-IN-HTS-J30*55-01,Inductive Sensors-J30*55-10 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,67,MVG-IN-HTS-J30*55-02,Inductive Sensors-J30*55-15 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,68,MVG-IN-HTS-J30*78-01,Inductive Sensors-J30*78-10 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,69,MVG-IN-HTS-J30*78-02,Inductive Sensors-J30*78-15 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,70,MVG-IN-LF-J8DW-01,Inductive Sensors-J8DW-2 mm NPN/PNP NO/NC,,KJT,,,USD,2,,,3 Days,Active
,71,MVG-IN-LF-J8GW-01,Inductive Sensors-J8GW-2 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,72,MVG-IN-LF-J12W-01,Inductive Sensors-J12W-2 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,73,MVG-IN-LF-J12DW-01,Inductive Sensors-J12DW-4 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,74,MVG-IN-LF-J30DW-01,Inductive Sensors-J30DW-10-22 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,75,MVG-IN-LF-J30GW-01,Inductive Sensors-J30GW-15 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,76,MVG-IN-LF-J30*55-01,Inductive Sensors-J30*55-10 mm PNP/NPN NO/NC,,KJT,,,USD,,,,3 Days,Active
,77,MVG-IN-LF-J30*55-02,Inductive Sensors-J30*55-10 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,78,MVG-IN-LF-J30*55-03,Inductive Sensors-J30*55-15 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,79,MVG-IN-LF-J30*55-04,Inductive Sensors-J30*55-15 mm PNP/NPN NO/NC,,KJT,,,USD,,,,3 Days,Active
,80,MVG-IN-LF-J30*78-01,Inductive Sensors-J30*78-10 mm PNP/NPN NO/NC/ NO+NC,,KJT,,,USD,,,,3 Days,Active
,81,MVG-IN-LF-J30*78-02,Inductive Sensors-J30*78-10 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,82,MVG-IN-LF-J30*78-03,Inductive Sensors-J30*78-10 mm PNP/NPN NO/NC,,KJT,,,USD,,,,3 Days,Active
,83,MVG-IN-LF-J30*78-04,Inductive Sensors-J30*78-15 mm NO/NC,,KJT,,,USD,,,,3 Days,Active
,84,MVG-IN-WIS-M8-01,Inductive Sensors-M8-1 mm PNP NO/NC,,KJT,,,USD,3,,,3 Days,Active
,85,MVG-IN-WIS-M8-02,Inductive Sensors-M8-2 mm PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,86,MVG-IN-WIS-M12-01,Inductive Sensors-M12-2 mm PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,87,MVG-IN-WIS-M12-02,Inductive Sensors-M12-4 mm PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,88,MVG-IN-WIS-M18-01,Inductive Sensors-M18-5 mm PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,89,MVG-IN-WIS-M18-02,Inductive Sensors-M18-8 mm PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,90,MVG-IN-WIS-M30*1.5-01,Inductive Sensors-M30-10 mm PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,91,MVG-IN-WIS-M30*1.5-02,Inductive Sensors-M30-15 mm PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,92,MVG-IN-RHS-Y8S-01,Inductive Sensors-Y8S-2.5 mm NPN/PNP NO/NC,,KJT,,,USD,Not available in packaging list,,,3 Days,Active
,93,MVG-IN-RHS-Y8X-01,Inductive Sensors-Y8X-2.5 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,94,MVG-IN-RHS-Y9-01,Inductive Sensors-Y9-2.5 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,95,MVG-IN-RHS-Y10S-01,Inductive Sensors-Y10S-2.5/4 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,96,MVG-IN-RHS-Y10X-01,Inductive Sensors-Y10X-2.5/4 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,97,MVG-IN-RHS-Y17-01,Inductive Sensors-Y17-5/8 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,98,MVG-IN-RHS-Y17A-01,Inductive Sensors-Y17A-5/8 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,99,MVG-IN-RHS-Y18-01,Inductive Sensors-Y18-4 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,100,MVG-IN-RHS-Y18A-01,Inductive Sensors-Y18-5/8 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,101,MVG-IN-RHS-Y25-01,Inductive Sensors-Y25-10/15 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,102,MVG-IN-RHS-BF40-01,Inductive Sensors-BF40-15/40 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,103,MVG-IN-RHS-BF40-C-01,Inductive Sensors-BF40-C-15/20/30 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,104,MVG-IN-RHS-BFT40-01,Inductive Sensors-BFT40-15/20/25 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,105,MVG-IN-RHS-BFT80-01,Inductive Sensors-BFT80-40/50 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,106,MVG-IN-ANN-T6-01,Inductive Sensors-T6-6 mm NPN/PNP NO/NC,,KJT,,,USD,Not available in packaging list,,,3 Days,Active
,107,MVG-IN-ANN-T6C-01,Inductive Sensors-T6C-6 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,108,MVG-IN-ANN-T10-01,Inductive Sensors-T10-10 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,109,MVG-IN-ANN-T10C-01,Inductive Sensors-T10C-10 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,110,MVG-IN-ANN-T15-01,Inductive Sensors-T15-15 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,111,MVG-IN-ANN-T15C-01,Inductive Sensors-T15C-15 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,112,MVG-IN-ANN-T21-01,Inductive Sensors-T21-21 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,113,MVG-IN-ANN-T21C-01,Inductive Sensors-T21C-21 mm NPN/PNP NO/NC,,KJT,,,USD,,,,3 Days,Active
,114,MVG-IN-EDD-WJ18A,Inductive Sensors-WJ18A-1-4 mm PNP,Image Not Found as the Product was not present in the delivery nor in the packaging list,KJT,,,USD,Not available in packaging list,,,3 Days,Active
,115,MVG-IN-EDD-WJ18B,Inductive Sensors-WJ18B-0-7 mm PNP,,KJT,,,USD,,,,3 Days,Active
,116,MVG-IN-EDD-WJ18C,Inductive Sensors-WJ18C-7-20 mm PNP,,KJT,,,USD,,,,3 Days,Active
,117,MVG-IN-EDD-WJ18D,Inductive Sensors-WJ18D-7-20 mm PNP,,KJT,,,USD,,,,3 Days,Active`;

async function main() {
  const lines = rawCsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  console.log(`Processing ${lines.length} lines...`);

  // Row 0: empty commas
  // Row 1: Header: ,S.No,Product Code,Product Description,Picture,Supplier,BOM,Standard Cost,Currency,Unit,Landed cost,Standard Price,Lead Time,Status
  let imported = 0;
  let updated = 0;

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');

    // Parts:
    // 0: empty
    // 1: S.No
    // 2: Product Code
    // 3: Product Description
    // 4: Picture
    // 5: Supplier
    // 6: BOM
    // 7: Standard Cost
    // 8: Currency
    // 9: Unit
    // 10: Landed cost
    // 11: Standard Price
    // 12: Lead Time
    // 13: Status

    const itemCode = parts[2]?.trim();
    const description = parts[3]?.trim();
    if (!itemCode || !description) continue;

    const picture = parts[4]?.trim();
    const supplier = parts[5]?.trim() || 'KJT';
    const bom = parts[6]?.trim() || null;
    const currency = parts[8]?.trim() || 'USD';
    const unit = parts[9]?.trim() || 'PCS';
    const leadTimeStr = parts[12]?.trim() || '3 Days';
    const leadTimeDays = parseInt(leadTimeStr.replace(/\D/g, ''), 10) || 3;

    const data = {
      itemCode,
      description,
      category: 'Inductive Sensors',
      supplierCode: supplier,
      currency,
      unit: unit && !isNaN(Number(unit)) ? `${unit} PCS` : (unit || 'PCS'),
      ppq: bom,
      leadTimeDays,
      status: ItemStatus.ACTIVE,
      imageUrl: picture && picture.startsWith('http') ? picture : null,
    };

    const existing = await prisma.item.findUnique({
      where: { itemCode },
    });

    if (existing) {
      await prisma.item.update({
        where: { itemCode },
        data,
      });
      updated++;
    } else {
      await prisma.item.create({
        data,
      });
      imported++;
    }
  }

  console.log(`Finished! Successfully created ${imported} new items and updated ${updated} existing items in live database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
