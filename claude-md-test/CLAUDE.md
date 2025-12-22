# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains examples demonstrating the Anthropic Skills API, a beta feature that enables Claude to work with document formats (xlsx, pptx, pdf, docx) through code execution.

## Key API Patterns

### Listing Available Skills
```python
client.beta.skills.list(
    source="anthropic",
    betas=["skills-2025-10-02"]
)
```

### Using Skills with Messages
Skills require both the `skills` beta and `code-execution` beta, configured via the `container` parameter:
```python
client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [{
            "type": "anthropic",
            "skill_id": "pptx",  # or xlsx, pdf, docx
            "version": "latest"
        }]
    },
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
    ...
)
```

## Dependencies

- `anthropic` Python SDK
- Valid Anthropic API key with sufficient credits
