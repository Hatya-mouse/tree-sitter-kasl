/**
 * @file A simple, and minimal audio processing language.
 * @author Shuntaro Kasatani <shuntar30@gmail.com>
 * @license Apache-2.0
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
    name: "kasl",

    extras: ($) => [/[ \t\r]/, $.comment],

    rules: {
        source_file: ($) => repeat(seq($.decl_stmt, /\n+/)),

        // --- STATEMENTS ---

        scope_stmts: ($) => repeat1(seq($.scope_stmt, /\n+/)),

        decl_stmt: ($) =>
            choice(
                $.import_stmt,
                $.typealias_stmt,
                $.func_decl_stmt,
                $.input_stmt,
                $.output_stmt,
                $.state_var_stmt,
                $.global_let_stmt,
                $.struct_field_stmt,
                $.struct_decl_stmt,
                $.operator_def_stmt,
                $.operator_func_stmt,
            ),

        scope_stmt: ($) =>
            choice(
                $.return_stmt,
                $.local_var_stmt,
                $.local_let_stmt,
                $.loop_stmt,
                $.if_stmt,
                $.block_stmt,
                $.assign_stmt,
                $.expr_stmt,
            ),

        import_stmt: ($) => seq("import", $.import_path),

        typealias_stmt: ($) =>
            seq("typealias", field("name", $.identifier), "=", $.type_name),

        func_decl_stmt: ($) =>
            seq(
                optional("static"),
                "func",
                field("name", $.identifier),
                "(",
                seq(
                    optional(seq($.func_param, repeat(seq(",", $.func_param)))),
                    optional(","),
                ),
                ")",
                optional(seq("->", $.type_name)),
                "{",
                optional($.scope_stmts),
                "}",
            ),

        input_stmt: ($) =>
            seq(
                repeat($.input_attr),
                "input",
                field("name", $.identifier),
                optional(seq(":", $.type_name)),
                "=",
                $.expr,
            ),

        output_stmt: ($) =>
            seq(
                "output",
                field("name", $.identifier),
                optional(seq(":", $.type_name)),
                "=",
                $.expr,
            ),

        state_var_stmt: ($) =>
            seq(
                "state",
                field("name", $.identifier),
                optional(seq(":", $.type_name)),
                "=",
                $.expr,
            ),

        global_let_stmt: ($) =>
            seq(
                "let",
                field("name", $.identifier),
                optional(seq(":", $.type_name)),
                "=",
                $.expr,
            ),

        struct_field_stmt: ($) =>
            seq(
                "var",
                field("name", $.identifier),
                optional(seq(":", $.type_name)),
                "=",
                $.expr,
            ),

        struct_decl_stmt: ($) =>
            seq(
                "struct",
                field("name", $.identifier),
                "{",
                repeat($.decl_stmt),
                "}",
            ),

        // --- PARSER SCOPE STMTS ---

        local_var_stmt: ($) =>
            seq(
                "var",
                $.identifier,
                optional(seq(":", $.type_name)),
                "=",
                $.expr,
            ),

        local_let_stmt: ($) =>
            seq(
                "let",
                $.identifier,
                optional(seq(":", $.type_name)),
                "=",
                $.expr,
            ),

        assign_stmt: ($) => prec(1, seq($.expr, "=", $.expr)),

        return_stmt: ($) => seq("return", $.expr),

        if_stmt: ($) =>
            seq(
                $.if_arm,
                optional(seq("else", $.if_arm)),
                optional(seq("else", "{", optional($.scope_stmts), "}")),
            ),

        if_arm: ($) => seq("if", $.expr, "{", optional($.scope_stmts), "}"),

        expr_stmt: ($) => seq($.expr, /\n+/),

        loop_stmt: ($) =>
            seq("loop", $.expr, "{", optional($.scope_stmts), "}"),

        block_stmt: ($) => seq("{", optional($.scope_stmts), "}"),

        // --- OPERATOR PROPERTIES ---

        prec_prop: ($) => seq("precedence", ":", $.integer),

        assoc_prop: ($) =>
            seq("associativity", ":", choice("left", "right", "none")),

        infix_props: ($) =>
            choice(
                seq($.prec_prop, ",", $.assoc_prop, optional(",")),
                seq($.assoc_prop, ",", $.prec_prop, optional(",")),
            ),

        prefix_props: ($) => seq($.prec_prop, optional(",")),

        postfix_props: ($) => seq($.prec_prop, optional(",")),

        operator_def_stmt: ($) =>
            seq(
                "operator",
                choice(
                    seq("infix", $.operator, "{", $.infix_props, "}"),
                    seq("prefix", $.operator, "{", $.prefix_props, "}"),
                    seq("postfix", $.operator, "{", $.postfix_props, "}"),
                ),
            ),

        operator_func_stmt: ($) =>
            seq(
                "func",
                choice("infix", "prefix", "postfix"),
                $.operator,
                "(",
                seq(
                    optional(seq($.func_param, repeat(seq(",", $.func_param)))),
                    optional(","),
                ),
                ")",
                optional(seq("->", $.type_name)),
                "{",
                optional($.scope_stmts),
                "}",
            ),

        // --- STATEMENT HELPERS ---

        func_param: ($) =>
            seq(
                optional($.identifier),
                $.identifier,
                optional(seq(":", $.type_name)),
                optional(seq("=", $.expr)),
            ),

        input_attr: ($) =>
            seq(
                "#",
                $.identifier,
                optional(
                    seq(
                        "(",
                        optional(seq($.expr, repeat(seq(",", $.expr)))),
                        optional(","),
                        ")",
                    ),
                ),
            ),

        func_call_arg: ($) => seq(optional(seq($.identifier, ":")), $.expr),

        func_call_args: ($) =>
            seq(
                "(",
                optional(
                    seq($.func_call_arg, repeat(seq(",", $.func_call_arg))),
                ),
                optional(","),
                ")",
            ),

        // --- EXPRESSIONS ---

        expr: ($) => prec.left(repeat1(seq($.expr_token, optional(/[ \t]*/)))),

        expr_token: ($) =>
            choice(
                $.operator_token,
                $.literal,
                $.func_call,
                $.identifier_token,
                $.parenthesized_token,
                $.dot_token,
                $.bracketed_token,
            ),

        bracket_content_token: ($) =>
            choice(
                $.operator_token,
                $.literal,
                $.func_call,
                $.identifier_token,
                $.parenthesized_token,
                $.dot_token,
                $.bracketed_token,
                $.semi_colon,
                $.comma_token,
            ),

        // --- TOKENS ---

        literal: ($) => choice($.decimal, $.integer, $.boolean),

        func_call: ($) => prec(1, seq($.identifier, $.func_call_args)),

        identifier_token: ($) => $.identifier,

        operator_token: ($) => $.operator,

        parenthesized_token: ($) =>
            seq("(", repeat1(seq($.expr_token, optional(/\n*/))), ")"),

        bracketed_token: ($) =>
            seq(
                "[",
                repeat1(seq($.bracket_content_token, optional(/\n*/))),
                "]",
            ),

        dot_token: ($) => ".",

        semi_colon: ($) => ";",

        comma_token: ($) => ",",

        // --- MISCELLANEOUS ---

        identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

        type_name: ($) =>
            choice(
                seq($.identifier, repeat(seq(".", $.identifier))),
                seq("[", $.type_name, ";", $.integer, "]"),
            ),

        operator: ($) => /[+\-*/%^<>=!?|&@~]+/,

        import_path: ($) => seq($.identifier, repeat(seq("/", $.identifier))),

        integer: ($) => /[0-9]+/,

        decimal: ($) => /[0-9]+\.[0-9]+/,

        boolean: ($) => choice("true", "false"),

        comment: ($) => /\/\/.*/,
    },
});
