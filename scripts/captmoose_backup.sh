#!/bin/bash

DB_DIR=/home/zack/Captmoose/databases

/usr/bin/mysqldump -u captmoose -p'__USER_PASS__' captmoose > $DB_DIR/db_$(date +%m-%d-%Y_%H-%M-%S).sql
/usr/bin/find $DB_DIR -mtime +10 -type f -delete

