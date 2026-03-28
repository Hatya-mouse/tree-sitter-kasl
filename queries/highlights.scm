; Keywords
[
    "import" "func" "let" "var" "state" "input" "output"
    "return" "if" "else" "loop" "struct" "typealias"
    "operator" "infix" "prefix" "static"
] @keyword

; Types
(type_name (identifier) @type)

; Functions
(func_decl_stmt (identifier) @function)
(func_call (identifier) @function)

; Literals
(integer) @number
(decimal) @number
(boolean) @boolean

; Identifiers
(identifier) @variable

; Operators
(operator) @operator

; Comments
(comment) @comment
