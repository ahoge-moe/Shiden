./generate.sh
branch_name=$(git symbolic-ref --short -q HEAD)
git add generatedproto/*
git commit -m "Generated"
git push --set-upstream origin ${branch_name}
