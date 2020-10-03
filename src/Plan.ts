import { isSharable, getSharableProps, isLabel, isId } from './Annotation'
import { isNodeClass, getNodeProps } from './Annotation'
import { serializeLeaf } from './Serialization'

enum SharableEnabled {
    Enabled,
    Disabled,
    PartiallyEnabled
}

export abstract class SharableNode {
    /** @internal */
    constructor(label: string) {
        this.label = label
    }

    getLabel() {
        return this.label
    }

    abstract setEnabled(enabled: boolean): void
    abstract getEnabled(): SharableEnabled

    abstract isLeaf(): boolean

    getSharables(): SharableNode[] {
        return []
    }

    getvalue(): any {
        return undefined
    }

    /** @internal */
    abstract export(): any

    /** @internal */
    private label: string
}

export class SharableScalar extends SharableNode {
    /** @internal */
    constructor(label: string, value: any) {
        super(label)
        this.value = value
        this.enabled = false
    }

    getValue() {
        return this.value
    }

    isLeaf() {
        return true
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled
    }

    getEnabled() {
        return this.enabled ? SharableEnabled.Enabled : SharableEnabled.Disabled
    }

    /** @internal */
    export() {
        return serializeLeaf(this.value)
    }

    /** @internal */
    private value: any
    /** @internal */
    private enabled: boolean
}

export class SharableObject extends SharableNode {
    /** @internal */
    constructor(label: string, classId: string) {
        super(label)
        this.sharables = new Map()
        this.ids = new Map()
        this.classId = classId
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

    setEnabled(enabled: boolean) {
        this.sharables.forEach(s => s.setEnabled(enabled))
    }

    getEnabled() {
        return SharableEnabled.PartiallyEnabled;
    }

    /** @internal */
    export() {
        let ret = { "__type": this.classId }

        ret = Array.from(this.ids.entries()).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: serializeLeaf(value) }), ret
        )

        ret = Array.from(this.sharables.entries()).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: value.export() }), ret
        )

        return ret;
    }

    /** @internal */
    private ids: Map<string, any>
    /** @internal */
    private sharables: Map<string, SharableNode>
    /** @internal */
    private classId: string
}

export class SharableArray extends SharableNode {
    /** @internal */
    constructor(label: string) {
        super(label)
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

    setEnabled(enabled: boolean) {
        this.sharables.forEach(s => s.setEnabled(enabled))
    }

    getEnabled() {
        return SharableEnabled.PartiallyEnabled;
    }

    /** @internal */
    export() {
        return this.sharables.map(s => s.export())
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

function getLabel(obj: any) {
    for (var m in obj) {
        if (isLabel(obj, m)) {
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
            let nodeProps = getNodeProps(e)
            if (isNodeClass(nodeProps)) {
                let label = getLabel(e)
                let subNode = new SharableObject(label, nodeProps!.id)
                addIds(subNode, e)
                addSharablesProperties(subNode, e)
                node.addSharable(subNode)
            }
            else if (typeof e === 'object') {
                let label = getLabel(e)
                node.addSharable(new SharableScalar(label, e))
            }
            else if (Array.isArray(e)) {
                let label = getLabel(e)
                let subNode = new SharableArray(label)
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
            let sharableProps = getSharableProps(obj, m)
            let val = getValue(obj, m)
            let nodeProps = getNodeProps(val)

            if (isNodeClass(nodeProps) && !sharableProps.forceToLeaf) {
                let subNode = new SharableObject(sharableProps.label, nodeProps!.id)
                addSharablesProperties(subNode, val)
                node.addSharable(m, subNode)
            }
            else if (Array.isArray(val) && !sharableProps.forceToLeaf) {
                let subNode = new SharableArray(sharableProps.label)
                addSharableElements(subNode, val)
                node.addSharable(m, subNode)
            }
            else {
                node.addSharable(m, new SharableScalar(sharableProps.label, val))
            }
        }
    }
}

export type Plan = SharableNode

export function createPlan(obj: any, rootLabel: string): Plan {
    let nodeProps = getNodeProps(obj)
    if (isNodeClass(nodeProps)) {
        let node = new SharableObject(rootLabel, nodeProps!.id)
        addSharablesProperties(node, obj)
        return node
    }
    else if (Array.isArray(obj)) {
        let node = new SharableArray(rootLabel)
        addSharableElements(node, obj)
        return node
    }
    else {
        return new SharableScalar(rootLabel, obj)
    }
}