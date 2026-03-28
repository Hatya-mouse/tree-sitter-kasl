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
            seq(
                "typealias",
                field("type_name", $.identifier),
                "=",
                field("type_name", $.type_name),
            ),

        func_decl_stmt: ($) =>
            seq(
                optional("static"),
                "func",
                field("func_name", $.identifier),
                "(",
                seq(
                    optional(seq($.func_param, repeat(seq(",", $.func_param)))),
                    optional(","),
                ),
                ")",
                optional(seq("->", field("type_name", $.type_name))),
                "{",
                /\n*/,
                optional($.scope_stmts),
                "}",
            ),

        input_stmt: ($) =>
            seq(
                repeat($.input_attr),
                "input",
                field("var_name", $.identifier),
                optional(seq(":", field("type_name", $.type_name))),
                "=",
                $.expr,
            ),

        output_stmt: ($) =>
            seq(
                "output",
                field("var_name", $.identifier),
                optional(seq(":", field("type_name", $.type_name))),
                "=",
                $.expr,
            ),

        state_var_stmt: ($) =>
            seq(
                "state",
                field("var_name", $.identifier),
                optional(seq(":", field("type_name", $.type_name))),
                "=",
                $.expr,
            ),

        global_let_stmt: ($) =>
            seq(
                "let",
                field("var_name", $.identifier),
                optional(seq(":", field("type_name", $.type_name))),
                "=",
                $.expr,
            ),

        struct_field_stmt: ($) =>
            seq(
                "var",
                field("var_name", $.identifier),
                optional(seq(":", field("type_name", $.type_name))),
                "=",
                $.expr,
            ),

        struct_decl_stmt: ($) =>
            seq(
                "struct",
                field("type_name", $.identifier),
                "{",
                /\n*/,
                repeat(seq($.decl_stmt, /\n+/)),
                "}",
            ),

        // --- PARSER SCOPE STMTS ---

        local_var_stmt: ($) =>
            seq(
                "var",
                field("var_name", $.identifier),
                optional(seq(":", field("type_name", $.type_name))),
                "=",
                $.expr,
            ),

        local_let_stmt: ($) =>
            seq(
                "let",
                field("var_name", $.identifier),
                optional(seq(":", field("type_name", $.type_name))),
                "=",
                $.expr,
            ),

        assign_stmt: ($) => prec(1, seq($.expr, "=", $.expr)),

        return_stmt: ($) => seq("return", $.expr),

        if_stmt: ($) =>
            seq(
                $.if_arm,
                optional(seq("else", /\n*/, $.if_arm)),
                optional(
                    seq(
                        "else",
                        /\n*/,
                        "{",
                        /\n*/,
                        optional($.scope_stmts),
                        "}",
                    ),
                ),
            ),

        if_arm: ($) =>
            seq("if", $.expr, "{", /\n*/, optional($.scope_stmts), "}"),

        expr_stmt: ($) => seq($.expr, /\n+/),

        loop_stmt: ($) =>
            seq("loop", $.expr, "{", /\n*/, optional($.scope_stmts), "}"),

        block_stmt: ($) => seq("{", /\n*/, optional($.scope_stmts), "}"),

        // --- OPERATOR PROPERTIES ---

        prec_prop: ($) => seq("precedence", ":", $.integer),

        assoc_prop: ($) =>
            seq("associativity", ":", choice("left", "right", "none")),

        infix_props: ($) =>
            choice(
                seq(
                    $.prec_prop,
                    /\n*/,
                    ",",
                    /\n*/,
                    $.assoc_prop,
                    /\n*/,
                    optional(","),
                    /\n*/,
                ),
                seq(
                    $.assoc_prop,
                    /\n*/,
                    ",",
                    /\n*/,
                    $.prec_prop,
                    /\n*/,
                    optional(","),
                    /\n*/,
                ),
            ),

        prefix_props: ($) => seq($.prec_prop, /\n*/, optional(","), /\n*/),

        postfix_props: ($) => seq($.prec_prop, /\n*/, optional(","), /\n*/),

        operator_def_stmt: ($) =>
            seq(
                "operator",
                choice(
                    seq(
                        "infix",
                        /\n*/,
                        $.operator,
                        /\n*/,
                        "{",
                        /\n*/,
                        $.infix_props,
                        "}",
                    ),
                    seq(
                        "prefix",
                        /\n*/,
                        $.operator,
                        /\n*/,
                        "{",
                        /\n*/,
                        $.prefix_props,
                        "}",
                    ),
                    seq(
                        "postfix",
                        $.operator,
                        "{",
                        /\n*/,
                        $.postfix_props,
                        "}",
                    ),
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
                optional(seq("->", field("type_name", $.type_name))),
                "{",
                /\n*/,
                optional($.scope_stmts),
                "}",
            ),

        // --- STATEMENT HELPERS ---

        func_param: ($) =>
            seq(
                optional(field("func_arg_label", $.identifier)),
                field("func_arg_name", $.identifier),
                optional(seq(":", field("type_name", $.type_name))),
                optional(seq("=", $.expr)),
            ),

        input_attr: ($) =>
            seq(
                "#",
                field("input_attr_name", $.identifier),
                optional(
                    seq(
                        "(",
                        optional(seq($.expr, repeat(seq(",", $.expr)))),
                        optional(","),
                        ")",
                    ),
                ),
            ),

        // --- EXPRESSIONS ---

        expr: ($) => prec.left(repeat1($.expr_token)),

        multiline_expr: ($) => prec.left(repeat1(seq($.expr_token, /\n*/))),

        expr_token: ($) =>
            choice(
                $.func_call,
                $.operator_token,
                $.literal,
                $.identifier_token,
                $.parenthesized_token,
                $.dot_token,
                $.bracketed_token,
            ),

        bracket_content_token: ($) =>
            choice(
                $.func_call,
                $.operator_token,
                $.literal,
                $.identifier_token,
                $.parenthesized_token,
                $.dot_token,
                $.bracketed_token,
                $.semi_colon,
                $.comma_token,
            ),

        // --- TOKENS ---

        literal: ($) => choice($.decimal, $.integer, $.boolean),

        // func_call: ($) =>
        //     prec(
        //         1,
        //         seq(
        //             field("func_name", $.identifier),
        //             "(",
        //             /\n*/,
        //             optional($.func_call_args),
        //             ")",
        //         ),
        //     ),

        func_call_arg: ($) =>
            choice(
                seq(
                    field("func_arg_label", $.identifier),
                    ":",
                    $.multiline_expr,
                ),
                $.multiline_expr,
            ),

        func_call: ($) =>
            prec(
                1,
                seq(
                    field("func_name", $.identifier),
                    "(",
                    /\n*/,
                    optional(
                        seq(
                            $.func_call_arg,
                            repeat(seq(",", /\n*/, $.func_call_arg)),
                        ),
                    ),
                    optional(","),
                    ")",
                ),
            ),

        identifier_token: ($) => field("var_name", $.identifier),

        operator_token: ($) => $.operator,

        parenthesized_token: ($) => seq("(", /\n*/, $.multiline_expr, ")"),

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

        import_path: ($) => seq($.identifier, repeat(seq("/", $.identifier))),

        operator: ($) => /[+\-*/%^<>=!?|&@~]+/,

        integer: ($) => /[0-9]+/,

        decimal: ($) => /[0-9]+\.[0-9]+/,

        boolean: ($) => choice("true", "false"),

        comment: ($) => /\/\/.*\n/,
    },
});
