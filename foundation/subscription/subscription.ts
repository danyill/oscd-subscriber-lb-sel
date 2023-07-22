const serviceTypeControlBlockTags: Partial<Record<string, string[]>> = {
  GOOSE: ['GSEControl'],
  SMV: ['SampledValueControl'],
  Report: ['ReportControl'],
  NONE: ['LogControl', 'GSEControl', 'SampledValueControl', 'ReportControl'],
};

/**
 * Check if the ExtRef is already subscribed to a FCDA Element.
 *
 * @param extRefElement - The Ext Ref Element to check.
 */
export function isSubscribed(extRefElement: Element): boolean {
  return (
    extRefElement.hasAttribute('iedName') &&
    extRefElement.hasAttribute('ldInst') &&
    extRefElement.hasAttribute('lnClass') &&
    extRefElement.hasAttribute('lnInst') &&
    extRefElement.hasAttribute('doName')
  );
}

export function findFCDAs(extRef: Element): Element[] {
  if (extRef.tagName !== 'ExtRef' || extRef.closest('Private')) return [];

  const [iedName, ldInst, prefix, lnClass, lnInst, doName, daName] = [
    'iedName',
    'ldInst',
    'prefix',
    'lnClass',
    'lnInst',
    'doName',
    'daName',
  ].map(name => extRef.getAttribute(name));
  const ied = Array.from(extRef.ownerDocument.getElementsByTagName('IED')).find(
    element =>
      element.getAttribute('name') === iedName && !element.closest('Private')
  );
  if (!ied) return [];

  return Array.from(ied.getElementsByTagName('FCDA'))
    .filter(item => !item.closest('Private'))
    .filter(
      fcda =>
        (fcda.getAttribute('ldInst') ?? '') === (ldInst ?? '') &&
        (fcda.getAttribute('prefix') ?? '') === (prefix ?? '') &&
        (fcda.getAttribute('lnClass') ?? '') === (lnClass ?? '') &&
        (fcda.getAttribute('lnInst') ?? '') === (lnInst ?? '') &&
        (fcda.getAttribute('doName') ?? '') === (doName ?? '') &&
        (fcda.getAttribute('daName') ?? '') === (daName ?? '')
    );
}

// function findFCDAs(update: Update): Element[] {
//   const extRef = update.element;
//   if (extRef.tagName !== 'ExtRef' || extRef.closest('Private')) return [];

//   const [iedName, ldInst, prefix, lnClass, lnInst, doName, daName] = [
//     'iedName',
//     'ldInst',
//     'prefix',
//     'lnClass',
//     'lnInst',
//     'doName',
//     'daName',
//   ].map(name => update.attributes[name]);
//   const ied = Array.from(extRef.ownerDocument.getElementsByTagName('IED')).find(
//     element =>
//       element.getAttribute('name') === iedName && !element.closest('Private')
//   );
//   if (!ied) return [];

//   return Array.from(ied.getElementsByTagName('FCDA'))
//     .filter(item => !item.closest('Private'))
//     .filter(
//       fcda =>
//         (fcda.getAttribute('ldInst') ?? '') === (ldInst ?? '') &&
//         (fcda.getAttribute('prefix') ?? '') === (prefix ?? '') &&
//         (fcda.getAttribute('lnClass') ?? '') === (lnClass ?? '') &&
//         (fcda.getAttribute('lnInst') ?? '') === (lnInst ?? '') &&
//         (fcda.getAttribute('doName') ?? '') === (doName ?? '') &&
//         (fcda.getAttribute('daName') ?? '') === (daName ?? '')
//     );
// }

/**
 * Simple function to check if the attribute of the Left Side has the same value as the attribute of the Right Element.
 *
 * @param leftElement        - The Left Element to check against.
 * @param leftAttributeName  - The name of the attribute (left) to check against.
 * @param rightElement       - The Right Element to check.
 * @param rightAttributeName - The name of the attribute (right) to check.
 */
export function sameAttributeValueDiffName(
  leftElement: Element | undefined,
  leftAttributeName: string,
  rightElement: Element | undefined,
  rightAttributeName: string
): boolean {
  return (
    (leftElement?.getAttribute(leftAttributeName) ?? '') ===
    (rightElement?.getAttribute(rightAttributeName) ?? '')
  );
}

/**
 * Locates the control block associated with an ExtRef.
 *
 * @param extRef - SCL ExtRef element
 * @returns - either a GSEControl or SampledValueControl block
 */
export function findControlBlock(extRef: Element): Element {
  const fcdas = findFCDAs(extRef);
  const cbTags =
    serviceTypeControlBlockTags[extRef.getAttribute('serviceType') ?? 'NONE'] ??
    [];
  const controlBlocks = new Set(
    fcdas.flatMap(fcda => {
      const dataSet = fcda.parentElement!;
      const dsName = dataSet.getAttribute('name') ?? '';
      const anyLN = dataSet.parentElement!;
      return cbTags
        .flatMap(tag => Array.from(anyLN.getElementsByTagName(tag)))
        .filter(cb => {
          if (extRef.getAttribute('srcCBName')) {
            const ln = cb.closest('LN0')!;
            const lnClass = ln.getAttribute('lnClass');
            const lnPrefix = ln.getAttribute('prefix') ?? '';
            const lnInst = ln.getAttribute('inst');

            const ld = ln.closest('LDevice')!;
            const ldInst = ld.getAttribute('inst');
            const cbName = cb.getAttribute('name');

            return (
              extRef.getAttribute('srcCBName') === cbName &&
              (extRef.getAttribute('srcLNInst') ?? '') === lnInst &&
              (extRef.getAttribute('srcLNClass') ?? 'LLN0') === lnClass &&
              (extRef.getAttribute('srcPrefix') ?? '') === lnPrefix &&
              (extRef.getAttribute('srcLDInst') ??
                extRef.getAttribute('ldInst')) === ldInst
            );
          }
          return cb.getAttribute('datSet') === dsName;
        });
    })
  );
  return controlBlocks.values().next().value;
}
