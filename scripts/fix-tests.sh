#!/bin/bash

# Script to update all test files to use the new test helpers

# List of test files to update
TEST_FILES=(
  "tests/search.test.ts"
  "tests/tags.test.ts"
  "tests/hot-questions.test.ts"
  "tests/moderation.test.ts"
  "tests/moderation-ui.test.ts"
  "tests/voting-ui.test.ts"
  "tests/faq.test.ts"
  "tests/reputation.test.ts"
  "tests/settings.test.ts"
  "tests/rls-policies.test.ts"
)

for file in "${TEST_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    
    # Add import for test helpers if not already present
    if ! grep -q "cleanupDatabase" "$file"; then
      # Find the line with the last import and add our import after it
      sed -i '' '/^import.*from/a\
import { cleanupDatabase, createTestProfile, createTestQuestion, createTestAnswer } from '\''./helpers/test-utils'\'';
' "$file"
    fi
    
    # Replace the cleanup code in beforeEach
    sed -i '' 's/await prisma\.vote\.deleteMany({});.*await prisma\.profile\.deleteMany({});/await cleanupDatabase();/g' "$file"
    
    echo "Updated $file"
  else
    echo "File not found: $file"
  fi
done

echo "All test files updated!"
