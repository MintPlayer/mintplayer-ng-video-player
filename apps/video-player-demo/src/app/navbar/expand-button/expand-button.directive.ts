import { Directive, TemplateRef } from '@angular/core';
import { BsNavbarComponent } from '../navbar/navbar.component';

@Directive({
  selector: '[bsExpandButton]'
})
export class BsExpandButtonDirective {

  constructor(navbar: BsNavbarComponent, templateRef: TemplateRef<any>) {
    navbar.expandButtonTemplate = templateRef;
  }
  
  public static ngTemplateContextGuard(
    dir: BsExpandButtonDirective,
    ctx: any
  ): ctx is BsExpandButtonContext {
    return true;
  }

}

export class BsExpandButtonContext {
  public $implicit: boolean = null!;
}