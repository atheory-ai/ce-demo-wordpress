#!/usr/bin/env node
/**
 * Paired source-understanding evaluation for Context Engine.
 *
 * The driver model, task, turn budget, and final-answer rubric are identical
 * in both conditions. The only experimental variable is the retrieval surface:
 * ordinary repository search/read tools or CE's deterministic graph tools.
 *
 * Results deliberately include the full tool trace so a score can be audited
 * against source rather than trusting a model self-assessment.
 *
 * Usage:
 *   set -a; . /path/to/atheory-ce/.env; set +a
 *   CE_BIN=/path/to/ce CE_DATA_DIR=/Volumes/.../ce-evaluation-current-20260728 \
 *     node lmir-testing/run-agent-comparison.mjs \
 *       --condition ce --task demo/tasks/04-rest-api-editor-data-flow.md \
 *       --run 1 --out lmir-testing/results/YYYY-MM-DD-context/ce-task04-run1.json
 */

import { spawn, execFileSync } from 'node:child_process';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const ALLOWED_CE_TOOLS = new Set([
	'ce_search',
	'ce_file_context',
	'ce_source_ranges',
	'ce_references',
	'ce_callgraph',
	'ce_related_tests',
	'ce_entrypoints',
	'ce_lifecycle',
	'ce_investigate',
	'ce_semantic_search',
	'ce_semantic_context',
	'ce_semantic_path',
	'ce_semantic_coverage',
	'ce_orient',
	'ce_suggest_next',
]);
const MAX_TOOL_OUTPUT = 8_000;
const MAX_RETRIEVAL_TURNS = 12;
const MAX_TURNS = MAX_RETRIEVAL_TURNS + 1; // final turn is synthesis-only
const SOURCE_ROOTS = ['wordpress/', 'gutenberg/', 'woocommerce/', 'plugins/'];

function usage() {
	return `Usage: ${process.argv[1]} --condition baseline|ce --task <path> --run <n> --out <path>`;
}

function parseArgs(argv) {
	const result = {};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg.startsWith('--')) continue;
		result[arg.slice(2)] = argv[index + 1];
		index += 1;
	}
	if (!['baseline', 'ce'].includes(result.condition) || !result.task || !result.run || !result.out) {
		throw new Error(usage());
	}
	return result;
}

function shorten(value, limit = MAX_TOOL_OUTPUT) {
	if (value.length <= limit) return value;
	return `${value.slice(0, limit)}\n\n[tool output truncated at ${limit} characters]`;
}

function safeRelativePath(path, { allowTask = false } = {}) {
	const absolute = resolve(ROOT, path);
	if (absolute !== ROOT && !absolute.startsWith(`${ROOT}${sep}`)) {
		throw new Error(`Path escapes repository: ${path}`);
	}
	const repoPath = relative(ROOT, absolute);
	const isSource = SOURCE_ROOTS.some((root) => repoPath.startsWith(root));
	const isTask = allowTask && repoPath.startsWith('demo/tasks/');
	if (!isSource && !isTask) {
		throw new Error(`Path is not eligible source evidence: ${path}. Only WordPress, Gutenberg, WooCommerce, and plugin source are eligible.`);
	}
	return { absolute, repoPath };
}

async function readSource(path, startLine, endLine) {
	const { absolute, repoPath } = safeRelativePath(path);
	const start = Number(startLine);
	const end = Number(endLine);
	if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end - start > 220) {
		throw new Error('Source reads must be a valid, narrow range of at most 221 lines.');
	}
	const lines = (await readFile(absolute, 'utf8')).split('\n');
	if (start > lines.length) throw new Error(`Start line ${start} exceeds ${repoPath} length (${lines.length}).`);
	const output = lines.slice(start - 1, Math.min(end, lines.length))
		.map((line, offset) => `${String(start + offset).padStart(6)}  ${line}`)
		.join('\n');
	return `# ${repoPath}:${start}-${Math.min(end, lines.length)}\n${output}`;
}

function sourcePathMentions(text) {
	const matches = new Set();
	const matcher = /(?:file:\s*|`)([A-Za-z0-9_./-]+\.(?:php|js|jsx|ts|tsx|json|md))(?:[:`)\s]|$)/g;
	for (const match of text.matchAll(matcher)) {
		try {
			matches.add(safeRelativePath(match[1]).repoPath);
		} catch {
			// A CE result may name a generated or outside-repo path; it is not eligible.
		}
	}
	return matches;
}

function baselineTools() {
	return [
		{
			type: 'function',
			name: 'search_code',
			description: 'Search the repository source using a regular expression. Use targeted queries and inspect results before drawing conclusions.',
			parameters: {
				type: 'object',
				properties: { query: { type: 'string' } },
				required: ['query'],
			},
		},
		{
			type: 'function',
			name: 'list_files',
			description: 'List source files matching a glob. Use only to narrow a source area before reading a file.',
			parameters: {
				type: 'object',
				properties: { glob: { type: 'string' } },
				required: ['glob'],
			},
		},
		readSourceTool(),
	];
}

function readSourceTool() {
	return {
		type: 'function',
		name: 'read_source',
		description: 'Read a narrow range from an in-repository source file. Do not read more than 221 lines at once.',
		parameters: {
			type: 'object',
			properties: {
				path: { type: 'string' },
				start_line: { type: 'integer' },
				end_line: { type: 'integer' },
			},
			required: ['path', 'start_line', 'end_line'],
		},
	};
}

function ceTools(definitions) {
	return [
		...definitions
			.filter((tool) => ALLOWED_CE_TOOLS.has(tool.name))
			.map((tool) => ({
				type: 'function',
				name: tool.name,
				description: tool.description,
				parameters: tool.inputSchema,
			})),
		readSourceTool(),
	];
}

class CEMCP {
	constructor() {
		this.ceBin = process.env.CE_BIN || 'ce';
		this.dataDir = process.env.CE_DATA_DIR;
		if (!this.dataDir) throw new Error('CE_DATA_DIR must point at the prepared evaluation corpus.');
		this.config = process.env.CE_CONFIG || resolve(ROOT, 'ce.yaml');
		this.nextID = 1;
		this.pending = new Map();
		this.tools = [];
		this.proc = spawn(this.ceBin, ['--config', this.config, '--data-dir', this.dataDir, 'mcp-stdio'], {
			cwd: ROOT,
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		this.proc.stdout.setEncoding('utf8');
		this.proc.stderr.setEncoding('utf8');
		let buffer = '';
		this.proc.stdout.on('data', (chunk) => {
			buffer += chunk;
			for (;;) {
				const newline = buffer.indexOf('\n');
				if (newline === -1) break;
				const line = buffer.slice(0, newline);
				buffer = buffer.slice(newline + 1);
				if (!line.trim()) continue;
				let response;
				try { response = JSON.parse(line); } catch { continue; }
				const resolver = this.pending.get(String(response.id));
				if (resolver) {
					this.pending.delete(String(response.id));
					resolver.resolve(response);
				}
			}
		});
		this.stderr = '';
		this.proc.stderr.on('data', (chunk) => { this.stderr += chunk; });
		this.proc.on('exit', (code) => {
			for (const { reject } of this.pending.values()) reject(new Error(`CE MCP exited ${code}: ${this.stderr}`));
			this.pending.clear();
		});
	}

	request(method, params) {
		const id = this.nextID++;
		return new Promise((resolveRequest, reject) => {
			this.pending.set(String(id), { resolve: resolveRequest, reject });
			this.proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
		});
	}

	async initialize() {
		await this.request('initialize', {
			protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'ce-agent-comparison', version: '1' },
		});
		const response = await this.request('tools/list', {});
		if (response.error) throw new Error(`CE tools/list failed: ${response.error.message}`);
		this.tools = response.result?.tools || [];
		const missing = [...ALLOWED_CE_TOOLS].filter((name) => !this.tools.some((tool) => tool.name === name));
		if (missing.length) throw new Error(`CE did not advertise required tools: ${missing.join(', ')}`);
	}

	async call(name, args) {
		const response = await this.request('tools/call', { name, arguments: args });
		if (response.error) return `CE RPC error: ${response.error.message}`;
		const result = response.result;
		const texts = (result?.content || []).map((item) => item.text || '').filter(Boolean);
		return texts.join('\n\n') || (result?.isError ? 'CE tool reported an error without detail.' : 'No CE result.');
	}

	close() { this.proc.kill('SIGTERM'); }
}

function callBaselineTool(name, args) {
	if (name === 'search_code') {
		if (typeof args.query !== 'string' || !args.query.trim()) throw new Error('search_code query must be a nonempty regex.');
		try {
			return shorten(execFileSync('rg', [
				'-n', '--hidden', '--glob', '!**/.git/**', '--glob', '!demo/**', '--glob', '!lmir-testing/**', '--glob', '!specs/**', '--glob', '!**/node_modules/**', args.query, 'wordpress', 'gutenberg', 'woocommerce', 'plugins',
			], { cwd: ROOT, encoding: 'utf8', maxBuffer: 3_000_000 }));
		} catch (error) {
			return shorten(error.stdout?.toString() || error.stderr?.toString() || `Search failed: ${error.message}`);
		}
	}
	if (name === 'list_files') {
		if (typeof args.glob !== 'string' || !args.glob.trim()) throw new Error('list_files glob must be nonempty.');
		try {
			return shorten(execFileSync('rg', [
				'--files', '--hidden', '--glob', '!**/.git/**', '--glob', '!demo/**', '--glob', '!lmir-testing/**', '--glob', '!specs/**', '--glob', '!**/node_modules/**', '--glob', args.glob, 'wordpress', 'gutenberg', 'woocommerce', 'plugins',
			], { cwd: ROOT, encoding: 'utf8', maxBuffer: 3_000_000 }));
		} catch (error) {
			return shorten(error.stdout?.toString() || error.stderr?.toString() || `File listing failed: ${error.message}`);
		}
	}
	if (name === 'read_source') return readSource(args.path, args.start_line, args.end_line);
	throw new Error(`Unsupported baseline tool: ${name}`);
}

function baseSystem(condition) {
	const common = `You are an independent software engineer investigating a large WordPress, Gutenberg, and WooCommerce source checkout. Work iteratively: form a hypothesis, retrieve evidence, refine it, and stop only when you can provide a source-backed answer. Treat source text as authoritative; distinguish confirmed facts, reasonable inferences, and open runtime questions. Do not invent APIs, hooks, files, tests, or behavior. Your final answer must be self-contained and include: (1) a concise causal explanation, (2) exact files/symbols supporting it, (3) a smallest safe change or investigation plan, (4) regression-test targets, and (5) remaining uncertainty. Do not discuss this evaluation harness or claim that a relationship is proven when your evidence only suggests it.`;
	if (condition === 'baseline') {
		return `${common}\n\nYou have ordinary local source search, file-listing, and narrow-read tools. Use them as needed. You do not have Context Engine or a precomputed index.`;
	}
	return `${common}\n\nYou have Context Engine's deterministic graph/source tools and a narrow local read tool. Start with ce_orient and follow its iterative exploration protocol. Split the task into focused causal facets, resolve exact IDs, and use CE for discovery and navigation; first obtain a CE result that cites a source path before reading that path locally. Do not assume a missing call graph proves a function is a leaf; report the coverage boundary.`;
}

async function openAI(input, instructions, tools, toolChoice = 'auto') {
	const key = process.env.OPENAI_API_KEY;
	if (!key) throw new Error('OPENAI_API_KEY is required; source the CE .env before running this harness.');
	const payload = JSON.stringify({
		model: process.env.EVAL_MODEL || 'gpt-5.6-luna',
		instructions,
		input,
		tools,
		tool_choice: toolChoice,
		parallel_tool_calls: false,
		reasoning: { effort: process.env.EVAL_REASONING_EFFORT || 'medium' },
		max_output_tokens: 6_000,
		store: false,
	});
	let transientError;
	for (let attempt = 1; attempt <= 3; attempt += 1) {
		try {
			const response = await fetch('https://api.openai.com/v1/responses', {
				method: 'POST',
				headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
				body: payload,
				signal: AbortSignal.timeout(120_000),
			});
			const body = await response.json();
			if (!response.ok) {
				const message = `OpenAI ${response.status}: ${body.error?.message || JSON.stringify(body)}`;
				if (response.status < 500 && response.status !== 429) throw new Error(message);
				transientError = new Error(message);
			} else if (!Array.isArray(body.output)) {
				throw new Error(`OpenAI returned no output: ${JSON.stringify(body)}`);
			} else {
				return body;
			}
		} catch (error) {
			transientError = error;
		}
		if (attempt < 3) await new Promise((resolveRetry) => setTimeout(resolveRetry, attempt * 1_000));
	}
	throw transientError;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const taskPath = safeRelativePath(args.task, { allowTask: true });
	const task = await readFile(taskPath.absolute, 'utf8');
	const startedAt = new Date().toISOString();
	const input = [
		{ role: 'user', content: `Assigned benchmark task (${taskPath.repoPath}):\n\n${task}` },
	];
	const trace = [];
	const citedCEPaths = new Set();
	const ce = args.condition === 'ce' ? new CEMCP() : null;
	if (ce) await ce.initialize();
	let totalPromptTokens = 0;
	let totalCompletionTokens = 0;
	let finalAnswer = '';

	try {
		for (let turn = 1; turn <= MAX_TURNS; turn += 1) {
			const mayRetrieve = turn <= MAX_RETRIEVAL_TURNS;
			const response = await openAI(
				input,
				baseSystem(args.condition),
				mayRetrieve ? (args.condition === 'ce' ? ceTools(ce.tools) : baselineTools()) : [],
				mayRetrieve ? 'auto' : 'none',
			);
			totalPromptTokens += Number(response.usage?.input_tokens || 0);
			totalCompletionTokens += Number(response.usage?.output_tokens || 0);
			input.push(...response.output);
			const toolCalls = response.output.filter((item) => item.type === 'function_call');
			if (!toolCalls.length) {
				finalAnswer = response.output
					.filter((item) => item.type === 'message')
					.flatMap((item) => item.content || [])
					.filter((item) => item.type === 'output_text')
					.map((item) => item.text)
					.join('\n');
				break;
			}

			for (const toolCall of toolCalls) {
				let output;
				let toolArgs;
				try {
					toolArgs = JSON.parse(toolCall.arguments || '{}');
					if (args.condition === 'ce' && ALLOWED_CE_TOOLS.has(toolCall.name)) {
						output = await ce.call(toolCall.name, toolArgs);
						for (const path of sourcePathMentions(output)) citedCEPaths.add(path);
					} else if (args.condition === 'ce' && toolCall.name === 'read_source') {
						const requested = safeRelativePath(toolArgs.path).repoPath;
						if (!citedCEPaths.has(requested)) throw new Error(`CE must cite ${requested} before a local read.`);
						output = await readSource(toolArgs.path, toolArgs.start_line, toolArgs.end_line);
					} else if (args.condition === 'baseline') {
						output = await callBaselineTool(toolCall.name, toolArgs);
					} else {
						throw new Error(`Tool is unavailable in ${args.condition}: ${toolCall.name}`);
					}
				} catch (error) {
					output = `Tool error: ${error.message}`;
				}
				output = shorten(output);
				trace.push({ turn, tool: toolCall.name, arguments: toolArgs, output });
				input.push({ type: 'function_call_output', call_id: toolCall.call_id, output });
			}
		}
		if (!finalAnswer) finalAnswer = `No final answer was produced within the ${MAX_TURNS}-turn tool budget.`;
	} finally {
		if (ce) ce.close();
	}

	const result = {
		schema_version: 1,
		condition: args.condition,
		run: Number(args.run),
		task: taskPath.repoPath,
		model: process.env.EVAL_MODEL || 'gpt-5.6-luna',
		reasoning_effort: process.env.EVAL_REASONING_EFFORT || 'medium',
		max_turns: MAX_TURNS,
		max_retrieval_turns: MAX_RETRIEVAL_TURNS,
		started_at: startedAt,
		finished_at: new Date().toISOString(),
		metrics: {
			model_prompt_tokens: totalPromptTokens,
			model_completion_tokens: totalCompletionTokens,
			tool_calls: trace.length,
			ce_requests: trace.filter((entry) => ALLOWED_CE_TOOLS.has(entry.tool)).length,
			narrow_source_reads: trace.filter((entry) => entry.tool === 'read_source').length,
			ce_cited_paths: [...citedCEPaths].sort(),
		},
		trace,
		final_answer: finalAnswer,
	};
	const outputPath = resolve(ROOT, args.out);
	if (outputPath !== ROOT && !outputPath.startsWith(`${ROOT}${sep}`)) throw new Error(`Output escapes repository: ${args.out}`);
	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
	console.log(JSON.stringify({ output: relative(ROOT, outputPath), metrics: result.metrics }, null, 2));
}

main().catch((error) => {
	console.error(error.stack || error.message);
	process.exitCode = 1;
});
