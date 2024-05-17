class LoggerUtil {

    constructor(prefix, style, disabled = false) {
        this.prefix = prefix;
        this.style = style;
        this.disabled = disabled;
    }

    log() {
        if (this.disabled) return;
        console.log.apply(null, [this.prefix, this.style, ...arguments])
    }

    info() {
        if (this.disabled) return;
        console.info.apply(null, [this.prefix, this.style, ...arguments])
    }

    warn() {
        if (this.disabled) return;
        console.warn.apply(null, [this.prefix, this.style, ...arguments])
    }

    debug() {
        if (this.disabled) return;
        console.debug.apply(null, [this.prefix, this.style, ...arguments])
    }

    error() {
        if (this.disabled) return;
        console.error.apply(null, [this.prefix, this.style, ...arguments])
    }

}

module.exports = function(prefix, style, disabled) {
    return new LoggerUtil(prefix, style, disabled)
}