#!/bin/bash
FILES=$(grep -rl 'const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));' src/)
for file in $FILES; do
  echo "Updating $file"
  # Use perl to replace the exact line.
  perl -pi -e 's/const isB2B = userRole && \(userRole.includes\("b2b_customer"\) \|\| userRole.includes\("administrator"\)\);/const isB2B = (userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"))) || (typeof user !== "undefined" && user && (user.b2b_status === "approved" || (user.meta_data && user.meta_data.b2b_status === "approved")));/g' "$file"
done
