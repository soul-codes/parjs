import {retargetSourcemaps} from "retarget-sourcemaps-after-move";
import sh = require("shelljs");

function run() {
    let pub = ".tmp/publish";
    let srcRoot = "src/lib";
    sh.rm("-rf", pub);
    sh.mkdir("-p", pub);
    sh.cp("-r", [
        "package.json",
        "LICENSE.md",
        "README.md"
    ], pub);
    sh.cp("-r", "dist/lib/.", pub);
    sh.cp("-r", "src/lib/.", `${pub}/src`);
    retargetSourcemaps({
        srcRoot: {
            old: srcRoot,
            new: `${pub}/src`
        },
        distRoot: {
            old: "dist/lib",
            new: ".tmp/publish"
        },
        distGlob: "**/*.js"
    });
}
run();