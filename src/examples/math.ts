/**
 * This is a simple yet powerful parser for mathematical expressions meant to demonstrate the power of Parjs.
 * It takes in a string such as:
 *      1 + 3 * 2
 * And outputs a AST such as:
 *      +(1, *(3, 2))
 * It can then evaluate the AST to get the result.
 * Some important features:
 *  1. Supports floating point numbers
 *  2. Maintains precedence and order of operations
 *  3. Maintains associativity
 *  4. Allows the use of parentheses
 *  5. Implemented using LR parsing techniques by using user state.
 *  6. Easily extendable by the addition of custom functions, variables, and more operators.
 */

import "../test/setup";

import {Parjser} from "../lib/internal/parjser";
import {each, replaceState, later, manySepBy, map, or} from "../lib/combinators";
import {anyCharOf, float, string} from "../lib/internal/parsers";
import {between} from "../lib/internal/combinators/between";
import {whitespace} from "../lib/internal/parsers/char-types";

interface Expression {
    kind: "expression";
}

class BinaryOperator implements Expression {
    kind: "expression" = "expression";

    constructor(public operator: string, public left: Expression, public right: Expression) {
    }
}

class NumericLiteral implements Expression {
    kind: "expression" = "expression";

    constructor(public value: number) {

    }
}

interface OperatorToken {
    kind: "operator";
    operator: string;
    precedence: number;
}

interface MathState {
    exprs: (Expression | OperatorToken)[];
}

let operators = [
    {operator: "+", precedence: 1},
    {operator: "-", precedence: 1},
    {operator: "*", precedence: 2},
    {operator: "/", precedence: 2}
];

/**
 * This function REDUCES a stack of operators using LR techniques for precedence parsing.
 * We don't have an operator precedence component in Parjs so we have to do this ourselves.
 * @param exprs
 * @param precedence
 */
let reduceWithPrecedence = (exprs: (OperatorToken | Expression)[], precedence ?: number) => {
    precedence = precedence == null ? -1 : precedence;
    let lastOperator: Expression | OperatorToken;

    while ((lastOperator = exprs[exprs.length - 2]) && lastOperator.kind === "operator" && lastOperator.precedence >= precedence) {
        let [lhs, op, rhs] = exprs.slice(exprs.length - 3) as [Expression, OperatorToken, Expression];
        exprs.length -= 3;
        exprs.push(new BinaryOperator(op.operator, lhs, rhs));
    }
};


let pExpr = later<Expression>();

// we have a built-in floating point parser in Parjs.
let pNumber = float().pipe(
    map(x => new NumericLiteral(x))
);

// Parentheses
let pLeftParen = string("(");
let pRightParen = string(")");

// An expression between parentheses.
let pParenExpr = pExpr.pipe(
    between(pLeftParen, pRightParen)
);

// either a numeric literal or an expression between parentheses, (a + b + c).
// We add the expression to the expresion stack instead of returning it.

let pUnit = pNumber.pipe(
    or(pParenExpr),
    each((result, state: MathState) => {
        state.exprs.push(result);
    }),
    between(whitespace())
);


// Parses a single operator and adds it to the expression stack.
// Each time an operator is parsed, the expression stack is potentially reduced to create a partial AST.
let pOp = anyCharOf(operators.map(x => x.operator).join()).pipe(
    each((op, state: MathState) => {
        let operator = operators.filter(o => o.operator === op)[0];
        reduceWithPrecedence(state.exprs, operator.precedence);
        state.exprs.push({
            ...operator,
            kind: "operator"
        });
    })
);

// Parses a single expression, which is recursively defined as a sequence of expressions separated by operators.
// Note the call to `replaceState` at the end. We need it because this parser can be called to parse an expression inside parentheses
// In that case, each parenthesized expression should have a separate expression stack so we don't reduce unnecessary operators.
// An isolated parser blanks out the user state and then restores it.

pExpr.init(pUnit.pipe(
    manySepBy(pOp),
    map((x, state: MathState) => {
        reduceWithPrecedence(state.exprs);
        let expr = state.exprs[0] as Expression;
        return expr;
    }),
    replaceState({})
));

let result = pExpr.parse("( 1 + 2 ) * 2 * 2+( 3 * 5   ) / 2 / 2 + 0.25", {
    exprs: []
});

let printAst = (ast: Expression) => {
    if (ast instanceof BinaryOperator) {
        return `${ast.operator}(${printAst(ast.left)}, ${printAst(ast.right)})`;
    } else if (ast instanceof NumericLiteral) {
        return ast.value.toString();
    }
};

let evalAst = (ast: Expression) => {
    if (ast instanceof BinaryOperator) {
        let vLeft = evalAst(ast.left);
        let vRight = evalAst(ast.right);
        switch (ast.operator) {
            case "+":
                return vLeft + vRight;
            case "*":
                return vLeft * vRight;
            case "-":
                return vLeft - vRight;
            case "/":
                return vLeft / vRight;
        }
    } else if (ast instanceof NumericLiteral) {
        return ast.value;
    }
};
console.log(printAst(result.value));
console.log(`Equals: ${evalAst(result.value)}`);

