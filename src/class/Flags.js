export class Flags {
    constructor(userFlags) {
        this.userFlags = userFlags
    }

    static BETA_TESTER = 1 << 0 // 1 - 1
    static VERIFIED = 1 << 1 // 10 - 2
    static PREMIUM = 1 << 2 // 100 - 4
    static MOD = 1 << 3 // 1000 - 8
    static ADMIN = 1 << 4 // 10000 - 16

    static FLAGS = {
        [Flags.BETA_TESTER]: "beta_tester",
        [Flags.VERIFIED]: "verified",
        [Flags.PREMIUM]: "premium",
        [Flags.MOD]: "mod",
        [Flags.ADMIN]: "admin",
    }

    hasFlag(flagValue) {
        return (this.userFlags & flagValue) === flagValue
    }

    isBeta() {
        return (this.userFlags & Flags.BETA_TESTER) !== 0
    }

    isVerified() {
        return (this.userFlags & Flags.VERIFIED) !== 0
    }

    isPremium() {
        return (this.userFlags & Flags.PREMIUM) !== 0
    }

    isMod() {
        return (this.userFlags & Flags.MOD) !== 0
    }

    isAdmin() {
        return (this.userFlags & Flags.ADMIN) !== 0
    }

    getAllFlags() {
        const flags = []

        for (const [key, value] of Object.entries(Flags.FLAGS)) {
            if (this.hasFlag(parseInt(key))) {
                flags.push(value)
            }
        }

        return flags
    }

    getTotalBit() {
        return (
            Flags.BETA_TESTER |
            Flags.VERIFIED |
            Flags.PREMIUM |
            Flags.MOD |
            Flags.ADMIN
        )
    }
}
