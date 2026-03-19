#!/usr/bin/env python3
"""
Seed the HRMS Organization Chart with all 46 employees.

Usage:
  python seed_orgchart.py [--api-url URL] [--emp-code MD001] [--password PASSWORD]

This script:
  1. Logs into the HRMS API as MD
  2. Sends a bulk seed request with the full org hierarchy
  3. Verifies the org chart data
"""

import json
import sys
import argparse
import urllib.request
import urllib.error
import ssl

# Full org hierarchy for Swetha Structures — 46 employees
# Format: { emp_code: reports_to }  (reports_to=None means root node)
ORG_HIERARCHY = {
    # Root 1: Managing Director
    "MD001": None,

    # Direct reports to MD
    "SSC006": "MD001",   # HR
    "SSC001": "MD001",   # Accounts
    "SSC002": "MD001",   # Office Admin
    "SSC009": "MD001",   # Senior Architect
    "SSC023": "MD001",   # Senior Staff

    # HR team (reports to SSC006)
    "SSC005": "SSC006",
    "SSC015": "SSC006",
    "SSC016": "SSC006",

    # Accounts team (reports to SSC001)
    "SSC007": "SSC001",
    "SSC008": "SSC001",
    "SSC004": "SSC001",

    # Office Admin team (reports to SSC002)
    "SSC012": "SSC002",
    "SSC014": "SSC002",
    "SSC013": "SSC002",

    # Senior Staff team (reports to SSC023)
    "SSC011": "SSC023",

    # Architecture dept (reports to SSC009)
    "SSC003": "SSC009",  # Site Supervisor
    "SSM001": "SSC009",  # Factory Supervisor

    # Site Supervisor team (reports to SSC003)
    "SSC017": "SSC003",  # Site Engineer
    "SSC019": "SSC003",
    "SSC010": "SSC003",

    # Site Engineer team (reports to SSC017)
    "SSC018": "SSC017",
    "SSC020": "SSC017",
    "SSC021": "SSC017",
    "SSC024": "SSC017",
    "SSC025": "SSC017",
    "SSC026": "SSC017",
    "SSC027": "SSC017",
    "SSC028": "SSC017",
    "SSC029": "SSC017",
    "SSC030": "SSC017",
    "SSC022": "SSC017",

    # Factory team (reports to SSM001)
    "SSM002": "SSM001",
    "SSM003": "SSM001",
    "SSM004": "SSM001",
    "SSM005": "SSM001",
    "SSM006": "SSM001",
    "SSM007": "SSM001",
    "SSM008": "SSM001",
    "SSM009": "SSM001",
    "SSM010": "SSM001",
    "SSM011": "SSM001",  # PEB Supervisor

    # PEB team (reports to SSM011)
    "SSM012": "SSM011",
    "SSM013": "SSM011",
    "SSM014": "SSM011",

    # Root 2: Garden/Security Supervisor
    "SSG003": None,

    # Garden team (reports to SSG003)
    "SSG001": "SSG003",
    "SSG002": "SSG003",
    "SSG004": "SSG003",
    "SSG005": "SSG003",
}


def api_request(url, method="GET", data=None, token=None):
    """Make an HTTP request to the HRMS API."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    # Allow self-signed certs
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            return json.loads(body), e.code
        except Exception:
            return {"error": body}, e.code
    except Exception as e:
        return {"error": str(e)}, 0


def main():
    parser = argparse.ArgumentParser(description="Seed HRMS Org Chart")
    parser.add_argument("--api-url", default="https://hrms.shadowmarket.ai",
                        help="HRMS API base URL")
    parser.add_argument("--emp-code", default="MD001",
                        help="Employee code to login as (must be MD)")
    parser.add_argument("--password", default="emp123",
                        help="Login password")
    args = parser.parse_args()

    base = args.api_url.rstrip("/")
    print(f"HRMS Org Chart Seeder")
    print(f"API: {base}")
    print(f"Employees in hierarchy: {len(ORG_HIERARCHY)}")
    print()

    # Step 1: Login
    print("[1/4] Logging in as", args.emp_code, "...")
    resp, status = api_request(
        f"{base}/api/auth/login",
        method="POST",
        data={"empCode": args.emp_code, "password": args.password}
    )
    if status != 200 or "token" not in resp:
        print(f"  ERROR: Login failed (HTTP {status}): {resp}")
        sys.exit(1)
    token = resp["token"]
    print(f"  OK — got JWT token")

    # Step 2: Check current org chart
    print("[2/4] Checking current org chart...")
    resp, status = api_request(f"{base}/api/orgchart", token=token)
    if status == 200 and isinstance(resp, list):
        print(f"  Current entries: {len(resp)}")
        if len(resp) >= len(ORG_HIERARCHY):
            print(f"  Already has {len(resp)} entries (>= {len(ORG_HIERARCHY)}). Updating anyway.")
    else:
        print(f"  Could not fetch (HTTP {status}): {resp}")

    # Step 3: Bulk seed
    print(f"[3/4] Seeding {len(ORG_HIERARCHY)} employees...")
    entries = []
    for emp_code, reports_to in ORG_HIERARCHY.items():
        entries.append({"emp_code": emp_code, "reports_to": reports_to})

    resp, status = api_request(
        f"{base}/api/orgchart/bulk",
        method="POST",
        data={"entries": entries},
        token=token
    )
    if status == 200 and resp.get("success"):
        print(f"  OK — inserted/updated {resp.get('inserted', '?')} entries")
        if resp.get("errors"):
            print(f"  Warnings: {resp['errors']}")
    else:
        print(f"  ERROR (HTTP {status}): {resp}")
        print("  Falling back to individual PUT requests...")
        success = 0
        failed = 0
        for emp_code, reports_to in ORG_HIERARCHY.items():
            r, s = api_request(
                f"{base}/api/orgchart/{emp_code}",
                method="PUT",
                data={"reports_to": reports_to},
                token=token
            )
            if s == 200:
                success += 1
            else:
                failed += 1
                print(f"    FAIL {emp_code}: {r}")
        print(f"  Individual results: {success} OK, {failed} failed")

    # Step 4: Verify
    print("[4/4] Verifying org chart...")
    resp, status = api_request(f"{base}/api/orgchart", token=token)
    if status == 200 and isinstance(resp, list):
        print(f"  Total entries in DB: {len(resp)}")

        # Build tree and count
        parent_map = {}
        for r in resp:
            ec = r.get("emp_code") or r.get("empCode", "")
            rt = r.get("reports_to") or r.get("reportsTo")
            parent_map[ec] = rt

        roots = [k for k, v in parent_map.items() if v is None]
        children_count = len([k for k, v in parent_map.items() if v is not None])
        print(f"  Root nodes: {len(roots)} ({', '.join(roots)})")
        print(f"  Child nodes: {children_count}")

        # Check for missing employees
        missing = [k for k in ORG_HIERARCHY if k not in parent_map]
        if missing:
            print(f"  WARNING: Missing employees: {missing}")
        else:
            print(f"  All {len(ORG_HIERARCHY)} employees present in org chart!")

        # Print tree summary
        print()
        print("Org Chart Tree:")
        print_tree(parent_map, roots)
    else:
        print(f"  Could not verify (HTTP {status}): {resp}")

    print()
    print("Done!")


def print_tree(parent_map, roots, level=0, prefix=""):
    """Print org chart as ASCII tree."""
    children_of = {}
    for emp, mgr in parent_map.items():
        if mgr:
            children_of.setdefault(mgr, []).append(emp)

    def _print(node, indent="", is_last=True):
        connector = "└── " if is_last else "├── "
        if indent:
            print(f"{indent}{connector}{node}")
        else:
            print(f"  {node}")
        kids = sorted(children_of.get(node, []))
        for i, child in enumerate(kids):
            extension = "    " if is_last else "│   "
            _print(child, indent + ("  " if not indent else extension), i == len(kids) - 1)

    for root in sorted(roots):
        _print(root)
        print()


if __name__ == "__main__":
    main()
