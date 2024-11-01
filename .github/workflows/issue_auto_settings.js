const issue = context.payload.issue;
if (!issue) {
    throw new Error("Issue payload is not available.");
}
const body = issue.body;
if (!body) {
    throw new Error("Issue body is empty.");
}

// 正規表現を使って本文からissueを抽出。
const parentIssueMatch = body.match(/マージ先: #(\d+)/g);
if (!parentIssueMatch) {
    console.log("No issue found in body.");
    return;
}

let parentIssueData;
const parentIssueNumber = parentIssueMatch[1];

try {
    parentIssueData = await github.rest.issues.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parentIssueNumber,
    });

} catch (error) {
    console.error(`Failed to fetch issue #${parentIssueNumber}:`, error);
    return;
}

// ラベル取得
const labelsToSet = parentIssueData.data.labels
                    .filter(label => !["stg", "dev", "fixed", "parent issue"].includes(label.name))
                    .map(label => label.name);
console.log(`labelsToSet: ${labelsToSet}`);

// マイルストーン取得
const milestoneToSet = parentIssueData.data.milestone.number;
console.log(`milestoneToSet: ${parentIssueData.data.milestone.title}`);

// issueのラベルとマイルストーンを更新
try {
    console.log(`Update issue #${issue.number}`);
    await github.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issue.number,
        labels: Array.from(labelsToSet),
        milestone: milestoneToSet,
    });

    console.log(`Update issue #${parentIssueNumber}`);
    await github.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parentIssueNumber,
        labels: Array.from(labelsToSet.push("parent issue")),
    });

} catch (error) {
    console.error(`Failed to update issue:`, error);
    return;
}