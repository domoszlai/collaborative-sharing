import { isSharable, getSharableProps, isTitle, isId } from './Annotation'
import { isNodeClass } from './Annotation'
import { serializeLeaf } from './Serialization'

enum SharableEnabled {
    Enabled,
    Disabled,
    PartiallyEnabled
}

export abstract class SharableNode {
    /** @internal */
    constructor(title: string) {
        this.title = title
    }

    getTitle() {
        return this.title
    }

    //abstract setEnabled(enabled: boolean): void
    //abstract getEnabled(): SharableEnabled

    abstract isLeaf(): boolean

    getSharables(): SharableNode[] {
        return []
    }

    getvalue(): any {
        return undefined
    }

    /** @internal */
    abstract serialize(): any

    /** @internal */
    private title: string
}

export class SharableScalar extends SharableNode {
    /** @internal */
    constructor(title: string, value: any) {
        super(title)
        this.value = value
    }

    getValue() {
        return this.value
    }

    isLeaf() {
        return true
    }

    /** @internal */
    serialize() {
        return {
            "__type": "__SharableScalar",
            "title": this.getTitle(),
            "value": serializeLeaf(this.value)
        }
    }

    /** @internal */
    private value: any
}

export class SharableObject extends SharableNode {
    /** @internal */
    constructor(title: string) {
        super(title)
        this.sharables = new Map()
        this.ids = new Map()
    }

    getSharables() {
        return Array.from(this.sharables.values())
    }

    /** @internal */
    addSharable(propertykey: string, sharable: SharableNode) {
        this.sharables.set(propertykey, sharable)
    }

    /** @internal */
    addId(propertykey: string, val: any) {
        this.ids.set(propertykey, val)
    }

    isLeaf() {
        return false
    }

    /** @internal */
    serialize() {
        const ids = Array.from(this.ids.entries()).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: serializeLeaf(value) }), {}
        )

        const sharables = Array.from(this.sharables.entries()).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: value.serialize() }), {}
        )

        return {
            "__type": "__SharableObject",
            "title": this.getTitle(),
            "ids": ids,
            "sharables": sharables
        }
    }

    /** @internal */
    private ids: Map<string, any>
    /** @internal */
    private sharables: Map<string, SharableNode>
}

export class SharableArray extends SharableNode {
    /** @internal */
    constructor(title: string) {
        super(title)
        this.sharables = []
    }

    getSharables() {
        return this.sharables
    }

    /** @internal */
    addSharable(sharable: SharableNode) {
        this.sharables.push(sharable)
    }

    isLeaf() {
        return false
    }

    /** @internal */
    serialize() {
        const sharables = this.sharables.map(s => s.serialize())

        return {
            "__type": "__SharableArray",
            "title": this.getTitle(),
            "sharables": sharables
        }
    }

    /** @internal */
    private sharables: SharableNode[]
}

function getValue(obj: any, propName: string) {
    let val = obj[propName]

    if (typeof val === 'function') {
        if (val.length == 0) {
            val = val()
        }
        else {
            val = null
        }
    }

    return val
}

function getTitle(obj: any) {
    for (var m in obj) {
        if (isTitle(obj, m)) {
            return getValue(obj, m)
        }
    }

    return undefined
}

function addIds(node: SharableObject, obj: any) {
    let ret: [string, any][] = []

    for (var m in obj) {
        if (isId(obj, m)) {
            ret.push([m, getValue(obj, m)])
        }
    }

    return ret
}

function addSharableElements(node: SharableArray, arr: any[]) {
    for (var e of arr) {
        if (e !== null) {
            if (isNodeClass(e)) {
                let title = getTitle(e)
                let subNode = new SharableObject(title)
                addIds(subNode, e)
                addSharablesProperties(subNode, e)
                node.addSharable(subNode)
            }
            else if (typeof e === 'object') {
                let title = getTitle(e)
                node.addSharable(new SharableScalar(title, e))
            }
            else if (Array.isArray(e)) {
                let title = getTitle(e)
                let subNode = new SharableArray(title)
                addSharableElements(subNode, e)
                node.addSharable(subNode)
            }
            else {
                node.addSharable(new SharableScalar(e.toString(), e))
            }
        }
    }
}

function addSharablesProperties(node: SharableObject, obj: any) {
    for (var m in obj) {
        if (isSharable(obj, m)) {
            let props = getSharableProps(obj, m)
            let val = getValue(obj, m)

            if (isNodeClass(val) && !props.forceToLeaf) {
                let subNode = new SharableObject(props.title)
                addSharablesProperties(subNode, val)
                node.addSharable(m, subNode)
            }
            else if (Array.isArray(val) && !props.forceToLeaf) {
                let subNode = new SharableArray(props.title)
                addSharableElements(subNode, val)
                node.addSharable(m, subNode)
            }
            else {
                node.addSharable(m, new SharableScalar(props.title, val))
            }
        }
    }
}

export type Plan = SharableObject

export function createPlan(obj: Object, rootTitle: string): Plan {
    let node = new SharableObject(rootTitle)
    addSharablesProperties(node, obj)
    return node
}