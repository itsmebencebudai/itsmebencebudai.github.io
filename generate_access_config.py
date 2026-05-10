from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parent
env_path = root / '.env'
output_path = root / 'project' / 'access-config.js'

if not env_path.exists():
    raise SystemExit('Missing .env file. Copy .env.example to .env and add your passwords.')

lines = env_path.read_text(encoding='utf-8').splitlines()
env = {}
for line in lines:
    line = line.strip()
    if not line or line.startswith('#'):
        continue
    if '=' not in line:
        continue
    key, value = line.split('=', 1)
    env[key.strip()] = value.strip().strip('"').strip("'")

accounts = {}
for key, password in env.items():
    if not key.startswith('PROJECT_PASSWORD_'):
        continue
    suffix = key[len('PROJECT_PASSWORD_'):]
    title_key = f'PROJECT_TITLE_{suffix}'
    path_key = f'PROJECT_PATH_{suffix}'
    title = env.get(title_key)
    href = env.get(path_key)
    if not title or not href:
        raise SystemExit(f'Missing {title_key} or {path_key} for {key}')
    hash_value = hashlib.sha256(password.encode('utf-8')).hexdigest()
    accounts[hash_value] = {
        'title': title,
        'href': href
    }

content = 'window.PROJECT_ACCESS = ' + json.dumps(accounts, indent=2) + ';\n'
output_path.write_text(content, encoding='utf-8')
print(f'Generated {output_path} with {len(accounts)} account(s).')
