/**
 * @module parjs/internal/implementation/parsers
 */
/** */
import {ParjsBasicAction} from "../../action";
import {ParsingState} from "../../state";
import {ReplyKind} from "../../../../reply";
import {LoudParser} from "../../../../loud";
import {BaseParjsParser} from "../../parser";

export function rest(): LoudParser<string> {
    return new class Rest extends BaseParjsParser {
        isLoud: true = true;
        expecting = "zero or more characters";

        _apply(pr: ParsingState) {
            let {position, input} = pr;
            let text = input.substr(Math.min(position, input.length));
            pr.position = input.length;
            pr.value = text;
            pr.kind = ReplyKind.Ok;
        }
    }();
}
