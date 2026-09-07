export interface SalesRow {
  date: string;
  product_id: string;
  product_name: string;
  category: string;
  city: string;
  price: number;
  units_sold: number;
  revenue: number;
  marketing_spend: number;
  inventory: number;
  competitor_price?: number;
  discount?: number;
}

export const RAW_CSV_DATA = `date,product_id,product_name,category,city,price,units_sold,revenue,marketing_spend,inventory,competitor_price,discount
2024-01-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,988,1566,1547208,45000,2314,1018,1
2024-01-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,988,1357,1340716,45000,2032,1018,1
2024-01-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,988,1229,1214252,45000,1859,1018,1
2024-01-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,719,2074,1491206,45000,3000,741,0
2024-01-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,719,1812,1302828,45000,2646,741,0
2024-01-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,719,1511,1086409,45000,2240,741,0
2024-01-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1259,1276,1606484,45000,1923,1297,3
2024-01-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1259,1003,1262777,45000,1554,1297,3
2024-01-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1259,849,1068891,45000,1346,1297,3
2024-02-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1014,1395,1414530,57622,2083,1007,0
2024-02-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1014,1166,1182324,57622,1774,1007,0
2024-02-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1014,1075,1090050,57622,1651,1007,0
2024-02-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,705,2364,1666620,57622,3391,700,0
2024-02-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,705,2012,1418460,57622,2916,700,0
2024-02-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,705,1663,1172415,57622,2445,700,0
2024-02-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1272,1099,1397928,57622,1684,1263,2
2024-02-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1272,991,1260552,57622,1538,1263,2
2024-02-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1272,939,1194408,57622,1468,1263,2
2024-03-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1017,1406,1429902,58639,2098,932,0
2024-03-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1017,1264,1285488,58639,1906,932,0
2024-03-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1017,1036,1053612,58639,1599,932,0
2024-03-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,677,2450,1658650,58639,3508,621,3
2024-03-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,677,1961,1327597,58639,2847,621,3
2024-03-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,677,1940,1313380,58639,2819,621,3
2024-03-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1300,1088,1414400,58639,1669,1192,0
2024-03-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1300,911,1184300,58639,1430,1192,0
2024-03-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1300,918,1193400,58639,1439,1192,0
2024-04-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,994,1613,1603322,47117,2378,866,1
2024-04-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,994,1330,1322020,47117,1996,866,1
2024-04-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,994,1095,1088430,47117,1678,866,1
2024-04-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,659,2545,1677155,47117,3636,574,6
2024-04-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,659,2133,1405647,47117,3080,574,6
2024-04-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,659,1901,1252759,47117,2766,574,6
2024-04-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1318,1127,1485386,47117,1721,1148,0
2024-04-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1318,860,1133480,47117,1361,1148,0
2024-04-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1318,874,1151932,47117,1380,1148,0
2024-05-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,967,1831,1770577,35148,2672,868,3
2024-05-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,967,1509,1459203,35148,2237,868,3
2024-05-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,967,1241,1200047,35148,1875,868,3
2024-05-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,669,2762,1847778,35148,3929,601,4
2024-05-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,669,2377,1590213,35148,3409,601,4
2024-05-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,669,2063,1380147,35148,2985,601,4
2024-05-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1310,1326,1737060,35148,1990,1176,0
2024-05-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1310,1095,1434450,35148,1678,1176,0
2024-05-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1310,943,1235330,35148,1473,1176,0
2024-06-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,960,1665,1598400,32116,2448,934,4
2024-06-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,960,1483,1423680,32116,2202,934,4
2024-06-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,960,1431,1373760,32116,2132,934,4
2024-06-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,697,2394,1668618,32116,3432,678,0
2024-06-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,697,2230,1554310,32116,3211,678,0
2024-06-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,697,1810,1261570,32116,2644,678,0
2024-06-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1282,1191,1526862,32116,1808,1247,1
2024-06-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1282,1081,1385842,32116,1659,1247,1
2024-06-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1282,948,1215336,32116,1480,1247,1
2024-07-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,980,1529,1498420,40809,2264,1006,2
2024-07-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,980,1267,1241660,40809,1910,1006,2
2024-07-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,980,1059,1037820,40809,1630,1006,2
2024-07-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,718,2097,1505646,40809,3031,737,0
2024-07-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,718,1792,1286656,40809,2619,737,0
2024-07-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,718,1582,1135876,40809,2336,737,0
2024-07-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1261,1111,1400971,40809,1700,1295,3
2024-07-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1261,969,1221909,40809,1508,1295,3
2024-07-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1261,899,1133639,40809,1414,1295,3
2024-08-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1008,1575,1587600,54855,2326,1018,0
2024-08-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1008,1155,1164240,54855,1759,1018,0
2024-08-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1008,1109,1117872,54855,1697,1018,0
2024-08-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,712,2196,1563552,54855,3165,719,0
2024-08-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,712,1845,1313640,54855,2691,719,0
2024-08-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,712,1701,1211112,54855,2496,719,0
2024-08-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1265,1151,1456015,54855,1754,1278,3
2024-08-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1265,1051,1329515,54855,1619,1278,3
2024-08-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1265,895,1132175,54855,1408,1278,3
2024-09-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1019,1536,1565184,59840,2274,956,0
2024-09-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1019,1220,1243180,59840,1847,956,0
2024-09-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1019,1083,1103577,59840,1662,956,0
2024-09-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,685,2413,1652905,59840,3458,643,2
2024-09-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,685,2025,1387125,59840,2934,643,2
2024-09-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,685,1916,1312460,59840,2787,643,2
2024-09-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1292,1193,1541356,59840,1811,1212,1
2024-09-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1292,916,1183472,59840,1437,1212,1
2024-09-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1292,884,1142128,59840,1393,1212,1
2024-10-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1002,2284,2288568,55682,3283,879,0
2024-10-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1002,1755,1758510,55682,2569,879,0
2024-10-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1002,1718,1721436,55682,2519,879,0
2024-10-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,662,3824,2531488,55682,5362,581,5
2024-10-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,662,2996,1983352,55682,4245,581,5
2024-10-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,662,2518,1666916,55682,3599,581,5
2024-10-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1316,1571,2067436,55682,2321,1154,0
2024-10-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1316,1399,1841084,55682,2089,1154,0
2024-10-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1316,1143,1504188,55682,1743,1154,0
2024-11-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,973,2201,2141573,41340,3171,859,3
2024-11-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,973,1813,1764049,41340,2648,859,3
2024-11-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,973,1589,1546097,41340,2345,859,3
2024-11-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,664,3467,2302088,41340,4880,586,5
2024-11-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,664,2726,1810064,41340,3880,586,5
2024-11-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,664,2787,1850568,41340,3962,586,5
2024-11-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1315,1689,2221035,41340,2480,1161,0
2024-11-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1315,1290,1696350,41340,1942,1161,0
2024-11-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1315,1088,1430720,41340,1669,1161,0
2024-12-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,959,2021,1938139,32500,2928,911,4
2024-12-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,959,1500,1438500,32500,2225,911,4
2024-12-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,959,1535,1472065,32500,2272,911,4
2024-12-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,689,2923,2013947,32500,4146,655,1
2024-12-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,689,2195,1512355,32500,3163,655,1
2024-12-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,689,2148,1479972,32500,3100,655,1
2024-12-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1290,1473,1900170,32500,2189,1226,1
2024-12-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1290,1149,1482210,32500,1751,1226,1
2024-12-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1290,1023,1319670,32500,1581,1226,1
2025-01-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,972,1566,1522152,36951,2314,989,3
2025-01-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,972,1183,1149876,36951,1797,989,3
2025-01-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,972,1227,1192644,36951,1856,989,3
2025-01-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,714,2131,1521534,36951,3077,727,0
2025-01-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,714,1701,1214514,36951,2496,727,0
2025-01-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,714,1590,1135260,36951,2347,727,0
2025-01-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1264,1111,1404304,36951,1700,1286,3
2025-01-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1264,926,1170464,36951,1450,1286,3
2025-01-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1264,849,1073136,36951,1346,1286,3
2025-02-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1001,1476,1477476,51303,2193,1024,0
2025-02-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1001,1215,1216215,51303,1840,1024,0
2025-02-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1001,1059,1060059,51303,1630,1024,0
2025-02-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,716,2024,1449184,51303,2932,732,0
2025-02-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,716,1887,1351092,51303,2747,732,0
2025-02-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,716,1530,1095480,51303,2266,732,0
2025-02-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1261,1284,1619124,51303,1933,1289,3
2025-02-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1261,1059,1335399,51303,1630,1289,3
2025-02-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1261,868,1094548,51303,1372,1289,3
2025-03-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1019,1432,1459208,59859,2133,979,0
2025-03-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1019,1134,1155546,59859,1731,979,0
2025-03-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1019,1147,1168793,59859,1748,979,0
2025-03-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,693,2242,1553706,59859,3227,666,1
2025-03-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,693,1905,1320165,59859,2772,666,1
2025-03-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,693,1732,1200276,59859,2538,666,1
2025-03-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1283,1172,1503676,59859,1782,1233,1
2025-03-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1283,1019,1307377,59859,1576,1233,1
2025-03-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1283,878,1126474,59859,1385,1233,1
2025-04-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1009,1401,1413609,54754,2091,897,0
2025-04-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1009,1311,1322799,54754,1970,897,0
2025-04-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1009,1107,1116963,54754,1694,897,0
2025-04-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,666,2516,1675656,54754,3597,592,5
2025-04-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,666,1971,1312686,54754,2861,592,5
2025-04-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,666,1766,1176156,54754,2584,592,5
2025-04-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1311,1131,1482741,54754,1727,1166,0
2025-04-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1311,1003,1314933,54754,1554,1166,0
2025-04-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1311,844,1106484,54754,1339,1166,0
2025-05-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,981,1691,1658871,42181,2483,857,2
2025-05-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,981,1544,1514664,42181,2284,857,2
2025-05-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,981,1298,1273338,42181,1952,857,2
2025-05-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,660,3011,1987260,42181,4265,576,6
2025-05-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,660,2249,1484340,42181,3236,576,6
2025-05-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,660,1992,1314720,42181,2889,576,6
2025-05-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1318,1300,1713400,42181,1955,1151,0
2025-05-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1318,1067,1406306,42181,1640,1151,0
2025-05-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1318,907,1195426,42181,1424,1151,0
2025-06-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,960,1641,1575360,32079,2415,891,4
2025-06-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,960,1593,1529280,32079,2351,891,4
2025-06-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,960,1257,1206720,32079,1897,891,4
2025-06-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,681,2519,1715439,32079,3601,632,3
2025-06-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,681,2180,1484580,32079,3143,632,3
2025-06-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,681,1876,1277556,32079,2733,632,3
2025-06-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1299,1237,1606863,32079,1870,1205,0
2025-06-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1299,958,1244442,32079,1493,1205,0
2025-06-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1299,861,1118439,32079,1362,1205,0
2025-07-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,966,1610,1555260,33735,2374,969,3
2025-07-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,966,1318,1273188,33735,1979,969,3
2025-07-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,966,1155,1115730,33735,1759,969,3
2025-07-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,709,2069,1466921,33735,2993,711,0
2025-07-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,709,1658,1175522,33735,2438,711,0
2025-07-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,709,1549,1098241,33735,2291,711,0
2025-07-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1270,1167,1482090,33735,1775,1274,2
2025-07-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1270,895,1136650,33735,1408,1274,2
2025-07-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1270,896,1137920,33735,1410,1274,2
2025-08-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,993,1550,1539150,47248,2293,1022,1
2025-08-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,993,1259,1250187,47248,1900,1022,1
2025-08-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,993,1173,1164789,47248,1784,1022,1
2025-08-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,719,2157,1550883,47248,3112,740,0
2025-08-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,719,1910,1373290,47248,2779,740,0
2025-08-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,719,1682,1209358,47248,2471,740,0
2025-08-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1259,1177,1481843,47248,1789,1296,3
2025-08-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1259,948,1193532,47248,1480,1296,3
2025-08-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1259,938,1180942,47248,1466,1296,3
2025-09-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1016,1514,1538224,58694,2244,998,0
2025-09-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1016,1220,1239520,58694,1847,998,0
2025-09-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1016,1104,1121664,58694,1690,998,0
2025-09-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,701,2353,1649453,58694,3377,689,0
2025-09-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,701,1908,1337508,58694,2776,689,0
2025-09-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,701,1600,1121600,58694,2360,689,0
2025-09-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1275,1128,1438200,58694,1723,1253,2
2025-09-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1275,1046,1333650,58694,1612,1253,2
2025-09-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1275,870,1109250,58694,1375,1253,2
2025-10-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,1015,2067,2098005,62050,2990,920,0
2025-10-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,1015,1865,1892975,62050,2718,920,0
2025-10-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,1015,1541,1564115,62050,2280,920,0
2025-10-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,673,3430,2308390,62050,4831,610,4
2025-10-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,673,3055,2056015,62050,4324,610,4
2025-10-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,673,2698,1815754,62050,3842,610,4
2025-10-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1304,1759,2293736,62050,2575,1182,0
2025-10-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1304,1377,1795608,62050,2059,1182,0
2025-10-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1304,1158,1510032,62050,1763,1182,0
2025-11-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,990,2100,2079000,49367,3035,861,1
2025-11-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,990,1846,1827540,49367,2692,861,1
2025-11-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,990,1762,1744380,49367,2579,861,1
2025-11-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,659,3827,2521993,49367,5366,573,6
2025-11-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,659,3008,1982272,49367,4261,573,6
2025-11-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,659,2742,1806978,49367,3902,573,6
2025-11-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1315,1689,2221035,41340,2480,1161,0
2025-11-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1315,1290,1696350,41340,1942,1161,0
2025-11-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1315,1088,1430720,41340,1669,1161,0
2025-12-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Mumbai,964,2030,1956920,34807,2941,875,4
2025-12-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Delhi,964,1643,1583852,34807,2418,875,4
2025-12-01,TOY-001,"STEM Educational Robot Toy","Educational Toys",Bengaluru,964,1562,1505768,34807,2309,875,4
2025-12-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Mumbai,689,2923,2013947,34807,4394,655,1
2025-12-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Delhi,689,2195,1512355,32500,3163,655,1
2025-12-01,TOY-002,"Creative Building Blocks Set","Construction Toys",Bengaluru,689,2148,1479972,32500,3100,655,1
2025-12-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Mumbai,1306,1317,1720002,34807,2189,1226,1
2025-12-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Delhi,1306,1057,1380442,34807,1627,1226,1
2025-12-01,TOY-003,"Speedster RC Stunt Car","Electronic Toys",Bengaluru,1306,1084,1415704,34807,1663,1226,1`;

export function parseCSVToDataset(csvText: string): SalesRow[] {
  const lines = csvText.trim().split("\n").filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const dataset: SalesRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser handling quotes
    const tokens: string[] = [];
    let insideQuote = false;
    let current = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        tokens.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    tokens.push(current.trim());

    if (tokens.length >= 10) {
      dataset.push({
        date: tokens[0],
        product_id: tokens[1],
        product_name: tokens[2].replace(/^"|"$/g, ""),
        category: tokens[3].replace(/^"|"$/g, ""),
        city: tokens[4],
        price: parseFloat(tokens[5]) || 0,
        units_sold: parseInt(tokens[6], 10) || 0,
        revenue: parseFloat(tokens[7]) || 0,
        marketing_spend: parseFloat(tokens[8]) || 0,
        inventory: parseInt(tokens[9], 10) || 0,
        competitor_price: tokens[10] ? parseFloat(tokens[10]) : undefined,
        discount: tokens[11] ? parseFloat(tokens[11]) : 0,
      });
    }
  }

  return dataset;
}

export function generateIndianToyDataset(): SalesRow[] {
  return parseCSVToDataset(RAW_CSV_DATA);
}

export function convertDatasetToCSV(rows: SalesRow[]): string {
  const headers = [
    "date",
    "product_id",
    "product_name",
    "category",
    "city",
    "price",
    "units_sold",
    "revenue",
    "marketing_spend",
    "inventory",
    "competitor_price",
    "discount"
  ];

  const csvLines = [headers.join(",")];
  for (const r of rows) {
    csvLines.push([
      r.date,
      r.product_id,
      `"${r.product_name}"`,
      `"${r.category}"`,
      r.city,
      r.price,
      r.units_sold,
      r.revenue,
      r.marketing_spend,
      r.inventory,
      r.competitor_price !== undefined ? r.competitor_price : "",
      r.discount !== undefined ? r.discount : 0
    ].join(","));
  }
  return csvLines.join("\n");
}
