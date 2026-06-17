# 人力名单模板（2.0）· OU Pivot 预检

## 必含列（员工明细模式，推荐）

| 列名 | 说明 | 示例 |
|------|------|------|
| `员工ID` | 唯一，一行一人 | `E-US-0001` |
| `OU` | 与台账 / Excel Pivot 一致 | `56N` 或 `56N(Tencent America LLC)` |
| `部门` | 部门名称 | `HR` |
| `成本中心` | FPP 成本中心 | `01400` |

上传命名示例：`IN_US_P0_人力名单_202607.csv`

## 上传后预检

```bash
python3 痛点攻坚实施包/preview_roster_ou_pivot.py \
  --input 上传输入/IN_US_P0_人力名单_202607.csv \
  --output 上传输出/Roster_OU_Pivot_US_202607.md \
  --summary-csv 上传输出/Roster_OU_Summary_US_202607.csv
```

输出应与你 Excel 里 **Count of 员工ID × OU** 的 Pivot 一致（如 56N=495, 56P=34, 5DN=52, Total=581）。

## 兼容旧版（汇总人数）

仍支持 `成本中心,部门,人数`；若含 `OU` 列则按 OU 分组汇总。

## 分摊规则（口径）

1. **供应商金额各不同** → 台账按 OU + 供应商分组，分别分摊  
2. **同一 OU 内** 才用该 OU 人数作分母，不用全表 Grand Total  
3. **同一成本中心多部门** → 先按 CC 汇总人数，再算占比  
