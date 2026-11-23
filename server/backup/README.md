# MongoDB backup data

This folder contains an Extended JSON demo snapshot for the six collections used by the application. It is generated from the project's included demo seed data and is not an export of a live production database.

| Collection | Records |
|---|---:|
| stores | 5 |
| customers | 8 |
| menuitems | 12 |
| shippers | 5 |
| orders | 45 |
| reviews | 15 |

Restore into the configured MongoDB database with `npm run restore`. The target database must be empty. To intentionally replace existing project collections, back them up first and run `npm --prefix server run restore -- backup --replace`.

To make a new demo snapshot without a running database, use `npm run backup:demo`. To export the current live database, use `npm run backup`; it writes to a timestamped directory under `server/live-backups/`, which is excluded from Git because it may contain personal or production data.
