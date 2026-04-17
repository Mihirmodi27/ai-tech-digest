-- Seed categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Models & Updates',         'models-updates',         1),
  ('Products & Launches',      'products-launches',      2),
  ('Funding & M&A',            'funding-ma',             3),
  ('Research & Papers',        'research-papers',        4),
  ('Open Source & Tooling',    'open-source-tooling',    5),
  ('Infrastructure & Compute', 'infrastructure-compute', 6),
  ('Policy & Regulation',      'policy-regulation',      7),
  ('Industry Signals',         'industry-signals',       8),
  ('Vertical Watch',           'vertical-watch',         9),
  ('Rumors & Unconfirmed',     'rumors-unconfirmed',     10)
ON CONFLICT (name) DO NOTHING;

-- Seed sources
INSERT INTO sources (name, favicon, url, rss_url) VALUES
  ('Reuters',          'R', 'https://www.reuters.com',          'https://www.reuters.com/technology/rss'),
  ('The Verge',        'V', 'https://www.theverge.com',         'https://www.theverge.com/rss/index.xml'),
  ('TechCrunch',       'T', 'https://techcrunch.com',           'https://techcrunch.com/feed/'),
  ('Bloomberg',        'B', 'https://www.bloomberg.com',        NULL),
  ('Ars Technica',     'A', 'https://arstechnica.com',          'https://feeds.arstechnica.com/arstechnica/technology-lab'),
  ('Wired',            'W', 'https://www.wired.com',            'https://www.wired.com/feed/rss'),
  ('The Information',  'I', 'https://www.theinformation.com',   NULL),
  ('MIT Tech Review',  'M', 'https://www.technologyreview.com', 'https://www.technologyreview.com/feed/'),
  ('VentureBeat',      'V', 'https://venturebeat.com',          'https://venturebeat.com/feed/'),
  ('ArXiv',            'X', 'https://arxiv.org',                NULL),
  ('Hacker News',      'H', 'https://news.ycombinator.com',     'https://hnrss.org/newest?points=100&q=AI'),
  ('GitHub Blog',      'G', 'https://github.blog',              'https://github.blog/feed/')
ON CONFLICT (name) DO NOTHING;
