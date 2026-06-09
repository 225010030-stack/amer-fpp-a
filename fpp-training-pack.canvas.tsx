import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  Pill,
  Row,
  Stack,
  Text,
} from "cursor/canvas";

export default function FppTrainingPackCanvas() {
  return (
    <Stack gap={16}>
      <H1>FPP 同事培训包（PPT大纲 + 概念对比）</H1>
      <Text>
        用途：内部分享时可直接照此讲解。内容覆盖 10 页以内 PPT 结构，以及 4 个核心概念的超简版对比。
      </Text>

      <Callout tone="info">
        建议讲法：先讲“全流程”，再讲“4个概念”，最后演示一次提交前检查命令。
      </Callout>

      <Card>
        <CardHeader
          title="A. 同事培训版 PPT 大纲（10页以内）"
          trailing={<Pill tone="accent">可直接套用</Pill>}
        />
        <CardBody>
          <Stack gap={8}>
            <Text>1. 目标页：本月 FPP 交付目标、时间点、分工</Text>
            <Text>2. 全流程页：Source → Process → FPP提交 → 校验 → 归档</Text>
            <Text>3. 材料来源页：人力数、供应商账单、SOP、模板</Text>
            <Text>4. 分摊逻辑页：人数基数、PCT、金额计算、合计校验</Text>
            <Text>5. FPP操作页：场景选择、Load Contract、附件、会计导入</Text>
            <Text>6. 提交前校验页：金额/币种/期间/附件/审批链 五项检查</Text>
            <Text>7. 常见错误页：命名不统一、期间错位、缺文件</Text>
            <Text>8. 自动化页：check_fpp_files.py + 待修复清单.md</Text>
            <Text>9. 角色分工页：准备人、复核人、提交人、审批接口人</Text>
            <Text>10. 落地计划页：本周动作、下周动作、Bot→Skills 路线</Text>
          </Stack>
        </CardBody>
      </Card>

      <Divider />

      <H2>B. 超简版概念对比（目的 / 输入 / 输出 / 负责人 / 常见错误）</H2>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader title="USA/Benefits Insurance" />
          <CardBody>
            <Stack gap={6}>
              <Text><strong>目的：</strong>管理美国福利保险类费用</Text>
              <Text><strong>输入：</strong>供应商账单（PDF）+ HC基数</Text>
              <Text><strong>输出：</strong>分摊结果 + FPP附件</Text>
              <Text><strong>负责人：</strong>福利运营/财务接口人</Text>
              <Text><strong>常见错误：</strong>月度账单目录命名不统一、账期错放</Text>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="USA/HR Service Fee" />
          <CardBody>
            <Stack gap={6}>
              <Text><strong>目的：</strong>管理美国 HR 服务运营类费用</Text>
              <Text><strong>输入：</strong>服务费账单 + 支持材料</Text>
              <Text><strong>输出：</strong>费用明细 + 提交附件包</Text>
              <Text><strong>负责人：</strong>HRSSC 费用运营同事</Text>
              <Text><strong>常见错误：</strong>费用文件散落、期间信息不清晰</Text>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="数据来源 - 海外人力数" />
          <CardBody>
            <Stack gap={6}>
              <Text><strong>目的：</strong>提供分摊基数（人数）</Text>
              <Text><strong>输入：</strong>HR 月度 headcount 数据</Text>
              <Text><strong>输出：</strong>可用于计算占比的 HC 数据表</Text>
              <Text><strong>负责人：</strong>人力数据接口人 + 费用运营复核人</Text>
              <Text><strong>常见错误：</strong>“上月 for 当月”目录缺失或错命名</Text>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="USA/CAN Vendor HC Analysis" />
          <CardBody>
            <Stack gap={6}>
              <Text><strong>目的：</strong>把总账单拆分到实体/成本中心</Text>
              <Text><strong>输入：</strong>人数基数 + 当月账单总额</Text>
              <Text><strong>输出：</strong>PCT占比 + 各实体应分摊金额</Text>
              <Text><strong>负责人：</strong>费用运营制作 + 财务复核</Text>
              <Text><strong>常见错误：</strong>合计不等于账单总额、期间不一致</Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Card>
        <CardHeader title="C. 培训结尾：统一动作（所有同事）" trailing={<Pill tone="positive">标准动作</Pill>} />
        <CardBody>
          <Stack gap={8}>
            <Text>1) 先跑检查：`python3 check_fpp_files.py --root . --fix-report ./待修复清单.md`</Text>
            <Text>2) 先处理“可立即修复”，再拉人确认“需人工确认”</Text>
            <Text>3) 按 `月度提交流程清单.md` 勾选提交，最后回填月报</Text>
          </Stack>
        </CardBody>
      </Card>

      <Row>
        <Text>适配说明：文档与脚本均可在不同电脑上使用（相对路径 + Python标准库）。</Text>
      </Row>
    </Stack>
  );
}
