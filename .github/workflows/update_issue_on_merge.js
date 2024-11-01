const pr = context.payload.pull_request;
if (!pr) throw new Error("Issue payload is not available.");

const { body: prBody, number: prNumber, title: prTitle, base: { ref: prBase }, milestone: prMilestone, labels: prLabels } = pr;
if (!prBody) {
    console.log("PR body is empty.");
    return;
}

const isPostReleaseBug = prLabels.some(label => label.name === "post-release bug");

// 取得条件に基づくIssueをフィルタリングする関数
const filterIssues = (issues, excludeLabels, includeLabels) => {
    return issues.filter(issue => {
        const labelNames = issue.labels.map(label => label.name);
        const hasExcludeLabel = excludeLabels?.some(label => labelNames.includes(label)) ?? false;
        const hasAllIncludeLabels = includeLabels ? includeLabels.every(label => labelNames.includes(label)) : true;
        return !hasExcludeLabel && hasAllIncludeLabels;
    });
};

// マイルストーンとラベルからIssueを取得する
const fetchIssuesByMilestoneAndLabel = async (milestone, excludeLabels, includeLabels) => {
    if (!milestone) return console.error("No milestone found.");
    try {
        const issues = await github.paginate(github.rest.issues.listForRepo, {
            owner: context.repo.owner,
            repo: context.repo.repo,
            milestone: milestone.number,
            state: "open",
        });
        return filterIssues(issues, excludeLabels, includeLabels);
    } catch (error) {
        console.error("Failed to fetch issues:", error);
    }
};

// Issueのラベルを更新
const updateIssueLabels = async (issueDatas, removeLabel, addLabel) => {
    for (const issueData of issueDatas) {
        const updatedLabels = issueData.labels
            .filter(label => label.name !== removeLabel)
            .map(label => label.name);
        updatedLabels.push(addLabel);
        
        try {
            await github.rest.issues.update({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueData.number,
                labels: Array.from(updatedLabels),
            });
        } catch (error) {
            console.error(`Failed to update issue #${issueData.number}:`, error);
        }
    }
};

// Issueをクローズ
const closeIssues = async (issueDatas) => {
    for (const issueData of issueDatas) {
        try {
            await github.rest.issues.update({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueData.number,
                state: "closed"
            });
        } catch (error) {
            console.error(`Failed to close issue #${issueData.number}:`, error);
        }
    }
};

// 正規表現でIssue情報を取得
const fetchIssueData = async (body, matchStr) => {
    const issueMatch = body.match(matchStr);
    if (!issueMatch) return console.log("No issue found in body.");
    
    const issueNumber = issueMatch[1];
    try {
        return await github.rest.issues.get({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: issueNumber,
        });
    } catch (error) {
        console.error(`Failed to fetch issue #${issueNumber}:`, error);
    }
};

// PRマージ後の処理
const processMerge = async (baseBranch, exclude, include, oldLabel, newLabel, closeLabel = null) => {
    console.log(`${baseBranch}ブランチへのPRがマージされました。`);
    const targetIssueDatas = await fetchIssuesByMilestoneAndLabel(prMilestone, exclude, include);
    await updateIssueLabels(targetIssueDatas, oldLabel, newLabel);

    if (closeLabel) {
        const issuesToClose = await fetchIssuesByMilestoneAndLabel(prMilestone, exclude, [closeLabel]);
        await closeIssues(issuesToClose);
    }
};

// 各環境のPRマージ後の処理
if (prBase === "develop") {
    await processMerge("develop", isPostReleaseBug ? null : ["post-release bug"], isPostReleaseBug ? ["post-release bug", "fixed"] : ["fixed"], "fixed", "dev");
} else if (prBase === "release") {
    await processMerge("release", isPostReleaseBug ? null : ["post-release bug"], isPostReleaseBug ? ["post-release bug", "dev"] : ["dev"], "dev", "stg");
} else if (prBase === "master") {
    await processMerge("master", isPostReleaseBug ? null : ["post-release bug"], isPostReleaseBug ? ["post-release bug", "stg"] : ["stg"], "stg", "prd", "prd");
} else {
    console.log(`${prBase} へのPRがマージされました。`);
}

// 固有のIssueデータ処理
const fixedIssueData = await fetchIssueData(prBody, /Fixed: #(\d+)/);
if (fixedIssueData) {
    console.log(`Issue #${fixedIssueData.data.number} に紐づくPRです。`);
    const parentIssueData = await fetchIssueData(fixedIssueData.data.body, /マージ先: #(\d+)/);
    
    if (parentIssueData) {
        console.log(`マージ先は Issue #${parentIssueData.data.number} です。`);
        let parentIssueBody = parentIssueData.data.body;
        const newEntry = `- #${fixedIssueData.data.number}`;
        const contentHeader = "## 対応内容";

        if (!parentIssueBody.includes(contentHeader)) {
            parentIssueBody += `\n\n${contentHeader}\n${newEntry}`;
        } else if (!parentIssueBody.includes(newEntry)) {
            parentIssueBody += `\n${newEntry}`;
        }
        
        const parentIssueLabels = parentIssueData.data.labels.map(label => label.name);
        const isFixed = !await fetchIssuesByMilestoneAndLabel(prMilestone, isPostReleaseBug ? ["parent issue", "fixed"] : ["post-release bug", "parent issue", "fixed"], isPostReleaseBug ? ["post-release bug"] : null).length;
        if (isFixed) parentIssueLabels.push("fixed");

        try {
            await github.rest.issues.update({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: parentIssueData.data.number,
                labels: Array.from(new Set(parentIssueLabels)),
                body: parentIssueBody,
            });
        } catch (error) {
            console.error(`Failed to update parent issue #${parentIssueData.data.number}:`, error);
        }

        await updateIssueLabels([fixedIssueData.data], "ready for review", "fixed");
    }
}