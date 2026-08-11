# 劳动力市场时间序列数据说明

`labor-market-timeseries-template.csv` 用于学生录入或整理公开数据，`teaching-sample-timeseries.csv` 仅为检验指标、图表和预测流程而构造的教学示例，不对应任何现实地区。

## 基本口径

- `period`：建议使用 `YYYY` 或 `YYYY-MM`，同一文件保持一致。
- 人口、职位空缺和产出字段：允许使用人、万人或指数，但同列和相邻期间必须统一单位，并在 `note` 说明。
- 工资字段：建议统一为元/月；若使用元/年或万元，必须在 `note` 明示。
- `employed + unemployed` 应与 `labor_force` 一致。
- `source` 与 `source_date` 不得省略来源名称和数据发布日期；无法核实的字段应留空，系统不会自动补值。
- `industry`、`region`、`occupation` 可用于结构比较；未覆盖的总体不能由样本直接外推。

## 可选字段

`wage_p10`、`wage_p25`、`wage_p75`、`wage_p90` 用于工资分布；青年群体字段用于青年失业率；`output` 与 `hours_worked` 足够时才计算基础单位劳动成本。缺失字段不会被系统伪造。
