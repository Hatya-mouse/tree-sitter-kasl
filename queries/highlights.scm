; Keywords
[
    "import" "func" "let" "var" "state" "input" "output"
    "return" "if" "else" "loop" "struct" "typealias"
    "operator" "infix" "prefix" "static"
] @keyword

; Types
(_ type_name: (identifier) @type)
(_ type_name: (_ (identifier)) @type)

; Functions
(func_decl_stmt func_name: (identifier) @function)
(func_param func_arg_label: (identifier) @label)
(func_param func_arg_name: (identifier) @variable)
(func_call func_name: (identifier) @function)
(func_call_arg func_arg_label: (identifier) @label)

; Literals
(integer) @number
(decimal) @number
(boolean) @boolean

; Identifiers
(_ var_name: (identifier) @variable)

; Import Path
(import_path) @string

; Operators
(operator) @operator

; Attributes
(input_attr input_attr_name: (identifier) @attribute)

; Comments
(comment) @comment
