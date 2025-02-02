// PRとそのデータの取得
const pr = context.payload.pull_request;
if (!pr) throw new Error("Issue payload is not available.");

const { body: prBody, number: prNumber, user: { login: creator } } = pr;
if (!prBody) {
    console.log("PR body is empty.");
    return;
}

// PRの本文からIssue番号を抽出
const issueNumber = extractIssueNumber(prBody, /Fixed: #(\d+)/);
if (!issueNumber) return console.log("No issue found in PR body.");

// Issueのデータを取得し、PRにラベル、マイルストーン、担当者を設定
try {
    const issueData = await getIssueData(issueNumber);
    const labelsToSet = filterLabels(issueData.data.labels, ["parent issue", "dev", "stg", "fixed"]);
    const milestoneToSet = issueData.data.milestone?.number || null;
    const isParentIssue = issueData.data.labels.some(label => label.name === "parent issue");

    if (labelsToSet.length > 0) {
        await updatePullRequestMilestoneAssignee(prNumber, milestoneToSet, creator);
        await addIssueLabels(prNumber, labelsToSet);
        if (!isParentIssue) {
            await updateIssueAssignee(issueNumber, creator);
            await addIssueLabels(issueNumber, ["ready for review"]);
        }
    }
} catch (error) {
    console.error("Failed to update issue and PR:", error);
}

// 特定の正規表現からIssue番号を抽出する関数
function extractIssueNumber(body, regex) {
    const match = body.match(regex);
    return match ? match[1] : null;
}

// Issueデータを取得する関数
async function getIssueData(issueNumber) {
    try {
        return await github.rest.issues.get({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: issueNumber,
        });
    } catch (error) {
        throw new Error(`Failed to fetch issue #${issueNumber}: ${error}`);
    }
}

// 特定のラベルを除外して残りを配列で返す関数
function filterLabels(labels, excludeLabels) {
    return labels
        .filter(label => !excludeLabels.includes(label.name))
        .map(label => label.name);
}

// PRにマイルストーンと担当者を設定する関数
async function updatePullRequestMilestoneAssignee(prNumber, milestone, assignee) {
    console.log(`Updating PR #${prNumber} milestone and assignee`);
    await github.rest.pulls.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prNumber,
        milestone: milestone,
        assignees: [assignee],
    });
}

// Issueの担当者を更新する関数
async function updateIssueAssignee(issueNumber, assignee) {
    console.log(`Updating assignee for issue #${issueNumber}`);
    await github.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber,
        assignees: [assignee],
    });
}

// Issueにラベルを追加する関数
async function addIssueLabels(issueNumber, labels) {
    console.log(`Adding labels to issue #${issueNumber}`);
    await github.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber,
        labels,
    });
}