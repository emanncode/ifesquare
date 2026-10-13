#!/usr/bin/env node
/**
 * scripts/log_tech_linear.js
 * Appends or creates the separate daily technical file log in Linear
 * Title: YYYY-MM-DD — Technical File Log
 */
const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = process.env.LINEAR_API_KEY;
if (!API_KEY) {
  console.error('Error: LINEAR_API_KEY environment variable is required.');
  process.exit(1);
}
const PROJECT_UUID = 'db6b2bc5-f866-44e9-8a52-516c40f3792c';

function makeRequest(query, variables) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: 'api.linear.app',
      path: '/graphql',
      method: 'POST',
      family: 4,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.errors) reject(new Error(JSON.stringify(parsed.errors)));
          else resolve(parsed.data);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/log_tech_linear.js <path-to-markdown-log-entry>');
    process.exit(1);
  }
  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const entryContent = fs.readFileSync(resolvedPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  const docTitle = `${today} — Technical File Log`;

  // 1. Check existing project documents
  const listQuery = `
    query {
      project(id: "${PROJECT_UUID}") {
        documents {
          nodes {
            id
            title
            content
          }
        }
      }
    }
  `;
  const listRes = await makeRequest(listQuery);
  const existingDoc = listRes?.project?.documents?.nodes?.find(d => d.title === docTitle);

  if (existingDoc) {
    const updatedContent = existingDoc.content + "\n\n---\n\n" + entryContent;
    const updateMutation = `
      mutation UpdateDoc($id: String!, $content: String!) {
        documentUpdate(id: $id, input: { content: $content }) {
          success
        }
      }
    `;
    await makeRequest(updateMutation, { id: existingDoc.id, content: updatedContent });
    console.log(`Updated existing Linear document: "${docTitle}" (${existingDoc.id})`);
  } else {
    const createMutation = `
      mutation CreateDoc($projectId: String!, $title: String!, $content: String!) {
        documentCreate(input: { projectId: $projectId, title: $title, content: $content }) {
          success
          document { id title }
        }
      }
    `;
    const header = `# ${today} — Technical File Log\n\nGranular technical changelog covering files modified, technologies, styling, logic, and rationale.\n\n`;
    await makeRequest(createMutation, { projectId: PROJECT_UUID, title: docTitle, content: header + entryContent });
    console.log(`Created new Linear document: "${docTitle}"`);
  }
}

main().catch(err => {
  console.error('Error logging to Linear:', err.message);
  process.exit(1);
});
