.286
; Macros para simular sonidos de percusión

bombo MACRO
    percussion 80, 1
ENDM

caja MACRO
    percussion 400, 1
ENDM

hihat MACRO
    percussion 2000, 1
ENDM

percussion MACRO freq, time
    LOCAL espera
    PUSH DX
    PUSH CX
    PUSH BX
    PUSH AX

    mov AL, 180
    out 43h, AL

    mov ax, &freq
    mov al, al         ; low byte
    out 42h, al
    mov al, ah         ; high byte
    out 42h, al

    in  al, 61h
    or  al, 3          ; enable speaker (set bits 0 and 1)
    out 61h, al

    wait_seconds &time

    in  al, 61h
    and al, 0FCh
    out 61h, al

    POP AX
    POP BX
    POP CX
    POP DX
ENDM

wait_seconds MACRO segundos
    LOCAL wait_loop

    PUSH AX
    PUSH BX
    PUSH CX
    PUSH DX

    mov ah, 00h
    int 1Ah
    mov bx, dx

    mov cx, segundos
    mov ax, 18
    mul cx
    add bx, ax

wait_loop:
    mov ah, 00h
    int 1Ah
    cmp dx, bx
    jb wait_loop

    POP DX
    POP CX
    POP BX
    POP AX
ENDM

seg_pila SEGMENT STACK
    DB 32 DUP('Stack...')
seg_pila ENDS

seg_datos SEGMENT
    ; Ya no necesitas frecuencias ni tiempos aquí
seg_datos ENDS

seg_codigo SEGMENT 'CODE'
    Assume SS:seg_pila, DS:seg_datos, CS:seg_codigo

    MAIN Proc Far

        push   DS
        push   0
        MOV    AX, seg_datos
        MOV    DS, AX
        MOV    ES, AX    

        inicio:
        ; Secuencia de percusión: bombo, caja, hi-hat
        bombo
        hihat
        caja
        hihat
        bombo
        hihat
        caja
        hihat

        JMP inicio
        fin:
    RET
MAIN ENDP

seg_codigo ENDS

END MAIN
